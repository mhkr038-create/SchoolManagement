import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { AssignmentStats } from '@school/types';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  // -------------------------------------------------------------
  // 1. STATS
  // -------------------------------------------------------------
  async getAssignmentStats(schoolId: string, isSuperAdmin = false): Promise<AssignmentStats> {
    const where: any = {};
    if (schoolId && schoolId !== 'ALL') {
      where.schoolId = schoolId;
    }

    const now = new Date();
    const [totalActive, pendingGrading, gradedSubmissions] = await Promise.all([
      this.prisma.assignment.count({
        where: {
          ...where,
          dueDate: { gte: now }
        }
      }),
      this.prisma.assignmentSubmission.count({
        where: {
          status: 'SUBMITTED',
          assignment: where
        }
      }),
      this.prisma.assignmentSubmission.findMany({
        where: {
          status: 'GRADED',
          assignment: where,
          marksAwarded: { not: null }
        },
        include: {
          assignment: { select: { maxMarks: true } }
        }
      })
    ]);

    let avgScore = 0;
    if (gradedSubmissions.length > 0) {
      let totalPct = 0;
      let count = 0;
      for (const sub of gradedSubmissions) {
        const max = Number(sub.assignment?.maxMarks) || 100;
        const awarded = Number(sub.marksAwarded) || 0;
        if (max > 0) {
          totalPct += (awarded / max) * 100;
          count++;
        }
      }
      avgScore = count > 0 ? Number((totalPct / count).toFixed(1)) : 0;
    }

    return {
      activeAssignments: totalActive,
      pendingGrading,
      gradedThisWeek: gradedSubmissions.length,
      averageClassScore: avgScore
    };
  }

  // -------------------------------------------------------------
  // 2. ASSIGNMENTS LIST & DETAILS
  // -------------------------------------------------------------
  async listAssignments(
    schoolId: string,
    params: {
      page?: number;
      limit?: number;
      classId?: string;
      sectionId?: string;
      subjectId?: string;
      teacherId?: string;
      search?: string;
      allBranches?: boolean;
    }
  ) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (!params.allBranches && schoolId && schoolId !== 'ALL') {
      where.schoolId = schoolId;
    }
    if (params.classId) where.classId = params.classId;
    if (params.sectionId) where.sectionId = params.sectionId;
    if (params.subjectId) where.subjectId = params.subjectId;
    if (params.teacherId) where.teacherId = params.teacherId;

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [total, assignments] = await Promise.all([
      this.prisma.assignment.count({ where }),
      this.prisma.assignment.findMany({
        where,
        skip,
        take: limit,
        include: {
          class: { select: { id: true, name: true, code: true } },
          section: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true, code: true } },
          teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
          submissions: {
            select: { id: true, status: true, marksAwarded: true }
          },
          _count: { select: { submissions: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Format stats for each assignment
    const items = await Promise.all(
      assignments.map(async (a) => {
        const totalEnrolled = await this.prisma.studentEnrollment.count({
          where: {
            classId: a.classId,
            sectionId: a.sectionId,
            status: { in: ['ENROLLED', 'ACTIVE'] }
          }
        });

        const submittedCount = a.submissions.length;
        const gradedCount = a.submissions.filter((s) => s.status === 'GRADED').length;
        const pendingCount = Math.max(0, totalEnrolled - submittedCount);

        return {
          ...a,
          maxMarks: a.maxMarks ? Number(a.maxMarks) : null,
          dueDate: a.dueDate.toISOString().split('T')[0],
          createdAt: a.createdAt.toISOString(),
          stats: {
            totalStudents: totalEnrolled,
            submittedCount,
            gradedCount,
            pendingCount
          }
        };
      })
    );

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getAssignmentById(schoolId: string, id: string) {
    const where: any = { id };
    if (schoolId && schoolId !== 'ALL') {
      where.schoolId = schoolId;
    }

    const assignment = await this.prisma.assignment.findFirst({
      where,
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        submissions: {
          include: {
            student: {
              select: { id: true, admissionNumber: true, firstName: true, lastName: true }
            },
            grader: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        }
      }
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    // Fetch all active enrolled students in this section to show full roster
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        classId: assignment.classId,
        sectionId: assignment.sectionId,
        status: { in: ['ENROLLED', 'ACTIVE'] }
      },
      include: {
        student: {
          select: { id: true, admissionNumber: true, firstName: true, lastName: true }
        }
      },
      orderBy: { student: { firstName: 'asc' } }
    });

    // Map roster with submission details
    const submissionMap = new Map(assignment.submissions.map((s) => [s.studentId, s]));

    const roster = enrollments.map((enr) => {
      const sub = submissionMap.get(enr.studentId);
      if (sub) {
        return {
          id: sub.id,
          assignmentId: assignment.id,
          studentId: enr.studentId,
          submissionText: sub.submissionText,
          fileUrl: sub.fileUrl,
          submittedAt: sub.submittedAt.toISOString(),
          marksAwarded: sub.marksAwarded ? Number(sub.marksAwarded) : null,
          feedback: sub.feedback,
          gradedBy: sub.gradedBy,
          status: sub.status,
          student: sub.student,
          grader: sub.grader
        };
      }
      return {
        id: `pending-${enr.studentId}`,
        assignmentId: assignment.id,
        studentId: enr.studentId,
        submissionText: null,
        fileUrl: null,
        submittedAt: '',
        marksAwarded: null,
        feedback: null,
        gradedBy: null,
        status: 'PENDING',
        student: enr.student,
        grader: null
      };
    });

    return {
      ...assignment,
      maxMarks: assignment.maxMarks ? Number(assignment.maxMarks) : null,
      dueDate: assignment.dueDate.toISOString().split('T')[0],
      createdAt: assignment.createdAt.toISOString(),
      roster,
      stats: {
        totalStudents: enrollments.length,
        submittedCount: assignment.submissions.length,
        gradedCount: assignment.submissions.filter((s) => s.status === 'GRADED').length,
        pendingCount: Math.max(0, enrollments.length - assignment.submissions.length)
      }
    };
  }

  // -------------------------------------------------------------
  // 3. CREATE & DELETE ASSIGNMENT
  // -------------------------------------------------------------
  async createAssignment(schoolId: string, teacherUserId: string, dto: CreateAssignmentDto) {
    const assignment = await this.prisma.assignment.create({
      data: {
        schoolId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        subjectId: dto.subjectId,
        teacherId: teacherUserId,
        title: dto.title,
        description: dto.description || null,
        dueDate: new Date(dto.dueDate),
        maxMarks: dto.maxMarks || 20,
        fileAttachmentUrl: dto.fileAttachmentUrl || null
      },
      include: {
        class: true,
        section: true,
        subject: true,
        teacher: { select: { firstName: true, lastName: true } }
      }
    });

    // Auto-create in-app notification for all enrolled students
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        classId: dto.classId,
        sectionId: dto.sectionId,
        status: { in: ['ENROLLED', 'ACTIVE'] }
      },
      select: { studentId: true }
    });

    // Students have linked User accounts with matching email or we can broadcast notification to school users
    return assignment;
  }

  async deleteAssignment(schoolId: string, id: string) {
    const existing = await this.prisma.assignment.findFirst({
      where: { id, ...(schoolId !== 'ALL' ? { schoolId } : {}) }
    });
    if (!existing) throw new NotFoundException('Assignment not found');

    return this.prisma.assignment.delete({ where: { id } });
  }

  // -------------------------------------------------------------
  // 4. SUBMISSION & GRADING
  // -------------------------------------------------------------
  async submitHomework(schoolId: string, studentId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: dto.assignmentId, ...(schoolId !== 'ALL' ? { schoolId } : {}) }
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const now = new Date();
    const isLate = now > assignment.dueDate;
    const status = isLate ? 'LATE' : 'SUBMITTED';

    return this.prisma.assignmentSubmission.upsert({
      where: {
        uq_student_assignment: {
          assignmentId: dto.assignmentId,
          studentId
        }
      },
      update: {
        submissionText: dto.submissionText || null,
        fileUrl: dto.fileUrl || null,
        submittedAt: now,
        status
      },
      create: {
        assignmentId: dto.assignmentId,
        studentId,
        submissionText: dto.submissionText || null,
        fileUrl: dto.fileUrl || null,
        submittedAt: now,
        status
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } }
      }
    });
  }

  async gradeSubmission(schoolId: string, graderUserId: string, submissionId: string, dto: GradeSubmissionDto) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: true, student: true }
    });

    if (!submission) throw new NotFoundException('Submission not found');

    const max = Number(submission.assignment.maxMarks) || 100;
    if (dto.marksAwarded > max) {
      throw new BadRequestException(`Awarded marks (${dto.marksAwarded}) cannot exceed max marks (${max})`);
    }

    const updated = await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marksAwarded: dto.marksAwarded,
        feedback: dto.feedback || null,
        gradedBy: graderUserId,
        status: 'GRADED'
      },
      include: {
        student: true,
        grader: { select: { firstName: true, lastName: true } }
      }
    });

    return {
      ...updated,
      marksAwarded: Number(updated.marksAwarded)
    };
  }
}