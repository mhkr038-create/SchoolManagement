import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateExaminationDto, UpdateExaminationDto } from './dto/create-examination.dto';
import { CreateExamScheduleDto } from './dto/create-schedule.dto';
import { BatchMarkEntryDto } from './dto/batch-marks.dto';
import { LockMarksDto } from './dto/lock-marks.dto';
import { CreateGradingSystemDto } from './dto/create-grading-system.dto';
import {
  ExamSheetResponse,
  ReportCardResponse,
  ReportCardSubjectRow,
  ClassExamSummaryResponse,
  ClassStudentSummary
} from '@school/types';

@Injectable()
export class ExaminationsService {
  constructor(private prisma: PrismaService) {}

  // -------------------------------------------------------------
  // 1. EXAMINATIONS CRUD
  // -------------------------------------------------------------

  async getExaminations(schoolId: string, academicYearId?: string) {
    const whereClause: any = { schoolId };
    if (academicYearId) {
      whereClause.academicYearId = academicYearId;
    }

    return this.prisma.examination.findMany({
      where: whereClause,
      include: {
        academicYear: {
          select: { id: true, name: true, isCurrent: true }
        },
        term: {
          select: { id: true, name: true }
        },
        schedules: {
          include: {
            class: { select: { id: true, name: true, code: true } },
            subject: { select: { id: true, name: true, code: true } },
            _count: { select: { marks: true } }
          },
          orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }]
        }
      },
      orderBy: { startDate: 'desc' }
    });
  }

  async getExaminationById(schoolId: string, id: string) {
    const exam = await this.prisma.examination.findFirst({
      where: { id, schoolId },
      include: {
        academicYear: true,
        term: true,
        schedules: {
          include: {
            class: { select: { id: true, name: true, code: true } },
            subject: { select: { id: true, name: true, code: true } },
            _count: { select: { marks: true } }
          },
          orderBy: [{ examDate: 'asc' }, { startTime: 'asc' }]
        }
      }
    });

    if (!exam) {
      throw new NotFoundException(`Examination with ID '${id}' not found`);
    }

    return exam;
  }

  async createExamination(schoolId: string, dto: CreateExaminationDto) {
    // Verify academic year belongs to school
    const year = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, schoolId }
    });
    if (!year) {
      throw new BadRequestException('Invalid academic year specified');
    }

    return this.prisma.examination.create({
      data: {
        schoolId,
        academicYearId: dto.academicYearId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        termId: dto.termId || null,
        isPublished: dto.isPublished ?? false
      },
      include: {
        academicYear: true,
        term: true
      }
    });
  }

  async updateExamination(schoolId: string, id: string, dto: UpdateExaminationDto) {
    await this.getExaminationById(schoolId, id);

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);
    if (dto.termId !== undefined) updateData.termId = dto.termId || null;
    if (dto.isPublished !== undefined) updateData.isPublished = dto.isPublished;

    return this.prisma.examination.update({
      where: { id },
      data: updateData,
      include: {
        academicYear: true,
        term: true
      }
    });
  }

  async deleteExamination(schoolId: string, id: string) {
    const exam = await this.getExaminationById(schoolId, id);

    // Check if any marks exist for this exam
    const marksCount = await this.prisma.studentMark.count({
      where: {
        schoolId,
        examSchedule: { examinationId: id }
      }
    });

    if (marksCount > 0) {
      throw new BadRequestException(
        `Cannot delete examination. It contains ${marksCount} recorded student marks.`
      );
    }

    await this.prisma.examination.delete({ where: { id } });
    return { success: true, message: 'Examination deleted successfully' };
  }

  // -------------------------------------------------------------
  // 2. EXAM SCHEDULES
  // -------------------------------------------------------------

  async createSchedule(schoolId: string, examinationId: string, dto: CreateExamScheduleDto) {
    await this.getExaminationById(schoolId, examinationId);

    // Validate class and subject
    const [cls, subj] = await Promise.all([
      this.prisma.class.findFirst({ where: { id: dto.classId, schoolId } }),
      this.prisma.subject.findFirst({ where: { id: dto.subjectId, schoolId } })
    ]);

    if (!cls) throw new BadRequestException('Class not found');
    if (!subj) throw new BadRequestException('Subject not found');

    // Check if schedule already exists for this exam, class, subject
    const existing = await this.prisma.examSchedule.findUnique({
      where: {
        uq_exam_schedule: {
          examinationId,
          classId: dto.classId,
          subjectId: dto.subjectId
        }
      }
    });

    if (existing) {
      throw new BadRequestException(
        `Schedule for ${cls.name} - ${subj.name} already exists in this examination`
      );
    }

    return this.prisma.examSchedule.create({
      data: {
        examinationId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        examDate: new Date(dto.examDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        maxMarks: dto.maxMarks,
        passingMarks: dto.passingMarks
      },
      include: {
        class: { select: { id: true, name: true, code: true } },
        subject: { select: { id: true, name: true, code: true } }
      }
    });
  }

  async deleteSchedule(schoolId: string, scheduleId: string) {
    const schedule = await this.prisma.examSchedule.findUnique({
      where: { id: scheduleId },
      include: { examination: true }
    });

    if (!schedule || schedule.examination.schoolId !== schoolId) {
      throw new NotFoundException('Exam schedule not found');
    }

    const marksCount = await this.prisma.studentMark.count({
      where: { examScheduleId: scheduleId }
    });

    if (marksCount > 0) {
      throw new BadRequestException(
        `Cannot delete paper schedule with ${marksCount} recorded marks.`
      );
    }

    await this.prisma.examSchedule.delete({ where: { id: scheduleId } });
    return { success: true, message: 'Schedule paper deleted successfully' };
  }

  // -------------------------------------------------------------
  // 3. GRADING SYSTEMS
  // -------------------------------------------------------------

  async getGradingSystems(schoolId: string) {
    let systems = await this.prisma.gradingSystem.findMany({
      where: { schoolId },
      include: {
        gradeScales: {
          orderBy: { minPercentage: 'desc' }
        }
      },
      orderBy: { isDefault: 'desc' }
    });

    if (systems.length === 0) {
      // Auto-provision standard Primary 7-Point Grading System
      const defaultSystem = await this.prisma.gradingSystem.create({
        data: {
          schoolId,
          name: 'Primary Standard 7-Point Grading Scale',
          type: 'PERCENTAGE',
          isDefault: true,
          gradeScales: {
            create: [
              { name: 'A+', minPercentage: 90, maxPercentage: 100, gradePoint: 10.0, remarks: 'Outstanding' },
              { name: 'A', minPercentage: 80, maxPercentage: 89.99, gradePoint: 9.0, remarks: 'Excellent' },
              { name: 'B', minPercentage: 70, maxPercentage: 79.99, gradePoint: 8.0, remarks: 'Very Good' },
              { name: 'C', minPercentage: 60, maxPercentage: 69.99, gradePoint: 7.0, remarks: 'Good' },
              { name: 'D', minPercentage: 50, maxPercentage: 59.99, gradePoint: 6.0, remarks: 'Satisfactory' },
              { name: 'E', minPercentage: 35, maxPercentage: 49.99, gradePoint: 4.0, remarks: 'Needs Improvement' },
              { name: 'F', minPercentage: 0, maxPercentage: 34.99, gradePoint: 0.0, remarks: 'Fail' }
            ]
          }
        },
        include: {
          gradeScales: { orderBy: { minPercentage: 'desc' } }
        }
      });
      systems = [defaultSystem];
    }

    return systems;
  }

  async createGradingSystem(schoolId: string, dto: CreateGradingSystemDto) {
    if (dto.isDefault) {
      await this.prisma.gradingSystem.updateMany({
        where: { schoolId },
        data: { isDefault: false }
      });
    }

    return this.prisma.gradingSystem.create({
      data: {
        schoolId,
        name: dto.name,
        type: dto.type,
        isDefault: dto.isDefault ?? false,
        gradeScales: {
          create: dto.scales.map((s) => ({
            name: s.name,
            minPercentage: s.minPercentage,
            maxPercentage: s.maxPercentage,
            gradePoint: s.gradePoint ?? null,
            remarks: s.remarks || null
          }))
        }
      },
      include: {
        gradeScales: { orderBy: { minPercentage: 'desc' } }
      }
    });
  }

  // -------------------------------------------------------------
  // 4. MARK ENTRY & SHEETS
  // -------------------------------------------------------------

  async getMarkSheet(
    schoolId: string,
    examScheduleId: string,
    sectionId: string
  ): Promise<ExamSheetResponse> {
    const schedule = await this.prisma.examSchedule.findUnique({
      where: { id: examScheduleId },
      include: {
        examination: true,
        class: true,
        subject: true
      }
    });

    if (!schedule || schedule.examination.schoolId !== schoolId) {
      throw new NotFoundException('Exam schedule not found');
    }

    // Fetch enrolled students in this class and section
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        schoolId,
        classId: schedule.classId,
        sectionId,
        status: 'ENROLLED'
      },
      include: {
        student: true
      },
      orderBy: [
        { rollNumber: 'asc' },
        { student: { lastName: 'asc' } }
      ]
    });

    // Fetch existing marks
    const marks = await this.prisma.studentMark.findMany({
      where: {
        examScheduleId,
        studentId: { in: enrollments.map((e) => e.studentId) }
      }
    });

    const markMap = new Map(marks.map((m) => [m.studentId, m]));

    // Fetch default grading scales
    const gradingSystems = await this.getGradingSystems(schoolId);
    const scales = gradingSystems[0]?.gradeScales || [];

    const maxMarks = Number(schedule.maxMarks);
    const passingMarks = Number(schedule.passingMarks);

    let isScheduleLocked = false;
    let markedCount = 0;
    let absentCount = 0;
    let passedCount = 0;
    let failedCount = 0;
    let totalScoreSum = 0;
    let highestMark = 0;
    let lowestMark = maxMarks;

    const entries = enrollments.map((enrollment) => {
      const mark = markMap.get(enrollment.studentId);
      const studentName = `${enrollment.student.firstName} ${enrollment.student.lastName}`;

      let marksObtained: number | null = null;
      let isAbsent = false;
      let remarks: string | null = null;
      let isLocked = false;
      let grade: string | null = null;
      let gradePoint: number | null = null;
      let isPassed = false;

      if (mark) {
        isAbsent = mark.isAbsent;
        remarks = mark.remarks;
        isLocked = mark.isLocked;
        if (mark.isLocked) isScheduleLocked = true;

        if (mark.isAbsent) {
          absentCount++;
          marksObtained = 0;
          grade = 'F';
          gradePoint = 0;
          isPassed = false;
        } else if (mark.marksObtained !== null) {
          marksObtained = Number(mark.marksObtained);
          markedCount++;
          totalScoreSum += marksObtained;
          if (marksObtained > highestMark) highestMark = marksObtained;
          if (marksObtained < lowestMark) lowestMark = marksObtained;

          const percentage = (marksObtained / maxMarks) * 100;
          const matchedScale = scales.find(
            (s) => percentage >= Number(s.minPercentage) && percentage <= Number(s.maxPercentage)
          );

          grade = matchedScale?.name || 'P';
          gradePoint = matchedScale?.gradePoint ? Number(matchedScale.gradePoint) : null;
          isPassed = marksObtained >= passingMarks;

          if (isPassed) passedCount++;
          else failedCount++;
        }
      }

      return {
        studentId: enrollment.studentId,
        admissionNumber: enrollment.student.admissionNumber,
        rollNumber: enrollment.rollNumber,
        studentName,
        marksObtained,
        isAbsent,
        remarks,
        isLocked,
        grade,
        gradePoint,
        isPassed
      };
    });

    const classAverage = markedCount > 0 ? Number((totalScoreSum / markedCount).toFixed(1)) : 0;
    if (markedCount === 0) lowestMark = 0;

    return {
      examSchedule: {
        id: schedule.id,
        examinationId: schedule.examinationId,
        examinationName: schedule.examination.name,
        classId: schedule.classId,
        className: schedule.class.name,
        subjectId: schedule.subjectId,
        subjectName: schedule.subject.name,
        examDate: schedule.examDate.toISOString().split('T')[0],
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        maxMarks,
        passingMarks,
        isLocked: isScheduleLocked
      },
      entries,
      summary: {
        totalStudents: enrollments.length,
        markedCount,
        absentCount,
        passedCount,
        failedCount,
        classAverage,
        highestMark,
        lowestMark
      }
    };
  }

  async batchSaveMarks(
    schoolId: string,
    userId: string,
    dto: BatchMarkEntryDto,
    canBypassLock = false
  ) {
    const schedule = await this.prisma.examSchedule.findUnique({
      where: { id: dto.examScheduleId },
      include: { examination: true }
    });

    if (!schedule || schedule.examination.schoolId !== schoolId) {
      throw new NotFoundException('Exam schedule not found');
    }

    const maxMarks = Number(schedule.maxMarks);

    // Check if any mark in the schedule is locked
    const lockedCount = await this.prisma.studentMark.count({
      where: {
        examScheduleId: dto.examScheduleId,
        isLocked: true
      }
    });

    if (lockedCount > 0 && !canBypassLock) {
      throw new ForbiddenException(
        'Marks for this paper are finalized and locked. Contact an administrator to amend records.'
      );
    }

    // Validate marks values
    for (const entry of dto.entries) {
      if (!entry.isAbsent && entry.marksObtained !== null && entry.marksObtained !== undefined) {
        if (entry.marksObtained < 0 || entry.marksObtained > maxMarks) {
          throw new BadRequestException(
            `Mark ${entry.marksObtained} is invalid. Must be between 0 and ${maxMarks}.`
          );
        }
      }
    }

    // Execute atomic upsert in a Prisma transaction
    await this.prisma.$transaction(async (tx) => {
      for (const entry of dto.entries) {
        const marksObtained = entry.isAbsent ? null : entry.marksObtained ?? null;

        await tx.studentMark.upsert({
          where: {
            uq_student_exam_mark: {
              examScheduleId: dto.examScheduleId,
              studentId: entry.studentId
            }
          },
          update: {
            marksObtained,
            isAbsent: entry.isAbsent,
            remarks: entry.remarks || null,
            enteredBy: userId
          },
          create: {
            schoolId,
            examScheduleId: dto.examScheduleId,
            studentId: entry.studentId,
            marksObtained,
            isAbsent: entry.isAbsent,
            remarks: entry.remarks || null,
            enteredBy: userId,
            isLocked: false
          }
        });
      }
    });

    return {
      success: true,
      message: `Successfully saved marks for ${dto.entries.length} students`
    };
  }

  async lockMarks(schoolId: string, userId: string, dto: LockMarksDto) {
    const schedule = await this.prisma.examSchedule.findUnique({
      where: { id: dto.examScheduleId },
      include: { examination: true }
    });

    if (!schedule || schedule.examination.schoolId !== schoolId) {
      throw new NotFoundException('Exam schedule not found');
    }

    const result = await this.prisma.studentMark.updateMany({
      where: {
        examScheduleId: dto.examScheduleId,
        schoolId
      },
      data: {
        isLocked: dto.isLocked
      }
    });

    // Record audit log
    await this.prisma.auditLog.create({
      data: {
        schoolId,
        userId,
        action: dto.isLocked ? 'UPDATE' : 'UPDATE',
        entityName: 'ExamSchedule',
        entityId: dto.examScheduleId,
        newValues: {
          examId: schedule.examinationId,
          scheduleId: dto.examScheduleId,
          updatedCount: result.count,
          isLocked: dto.isLocked
        }
      }
    });

    return {
      success: true,
      message: dto.isLocked
        ? 'Marks successfully finalized and locked.'
        : 'Marks unlocked for editing.'
    };
  }

  // -------------------------------------------------------------
  // 5. CLASS RESULT SUMMARY & RANKINGS
  // -------------------------------------------------------------

  async getClassSummary(
    schoolId: string,
    examinationId: string,
    classId: string,
    sectionId: string
  ): Promise<ClassExamSummaryResponse> {
    const [exam, cls, sec] = await Promise.all([
      this.getExaminationById(schoolId, examinationId),
      this.prisma.class.findFirst({ where: { id: classId, schoolId } }),
      this.prisma.section.findFirst({ where: { id: sectionId, classId } })
    ]);

    if (!cls || !sec) throw new BadRequestException('Class or section not found');

    // Schedules for this examination and class
    const schedules = await this.prisma.examSchedule.findMany({
      where: { examinationId, classId }
    });

    // Enrolled students
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { schoolId, classId, sectionId, status: 'ENROLLED' },
      include: { student: true },
      orderBy: [{ rollNumber: 'asc' }, { student: { lastName: 'asc' } }]
    });

    // All marks for these schedules
    const marks = await this.prisma.studentMark.findMany({
      where: {
        examScheduleId: { in: schedules.map((s) => s.id) },
        studentId: { in: enrollments.map((e) => e.studentId) }
      }
    });

    // Fetch grading scale
    const gradingSystems = await this.getGradingSystems(schoolId);
    const scales = gradingSystems[0]?.gradeScales || [];

    const totalMaxMarks = schedules.reduce((sum, s) => sum + Number(s.maxMarks), 0);

    const studentSummaries: ClassStudentSummary[] = enrollments.map((enrollment) => {
      const studentMarks = marks.filter((m) => m.studentId === enrollment.studentId);

      let totalObtained = 0;
      let hasFailedSubject = false;

      for (const sched of schedules) {
        const m = studentMarks.find((sm) => sm.examScheduleId === sched.id);
        if (!m || m.isAbsent || m.marksObtained === null) {
          hasFailedSubject = true;
        } else {
          const score = Number(m.marksObtained);
          totalObtained += score;
          if (score < Number(sched.passingMarks)) {
            hasFailedSubject = true;
          }
        }
      }

      const percentage = totalMaxMarks > 0 ? Number(((totalObtained / totalMaxMarks) * 100).toFixed(1)) : 0;
      const matchedScale = scales.find(
        (s) => percentage >= Number(s.minPercentage) && percentage <= Number(s.maxPercentage)
      );

      const overallGrade = matchedScale?.name || 'P';
      const status: 'PASSED' | 'FAILED' = hasFailedSubject || percentage < 35 ? 'FAILED' : 'PASSED';

      return {
        studentId: enrollment.studentId,
        admissionNumber: enrollment.student.admissionNumber,
        rollNumber: enrollment.rollNumber,
        studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        totalMarksObtained: totalObtained,
        totalMaxMarks,
        percentage,
        overallGrade,
        classRank: 0, // Computed below
        status
      };
    });

    // Rank students by total marks descending
    studentSummaries.sort((a, b) => b.totalMarksObtained - a.totalMarksObtained);
    studentSummaries.forEach((s, idx) => {
      s.classRank = idx + 1;
    });

    const passedCount = studentSummaries.filter((s) => s.status === 'PASSED').length;
    const failedCount = studentSummaries.length - passedCount;
    const passPercentage =
      studentSummaries.length > 0 ? Number(((passedCount / studentSummaries.length) * 100).toFixed(1)) : 0;

    const totalPct = studentSummaries.reduce((sum, s) => sum + s.percentage, 0);
    const classAvgPct =
      studentSummaries.length > 0 ? Number((totalPct / studentSummaries.length).toFixed(1)) : 0;
    const highestPct = studentSummaries.length > 0 ? studentSummaries[0].percentage : 0;

    return {
      examinationId: exam.id,
      examinationName: exam.name,
      classId: cls.id,
      className: cls.name,
      sectionId: sec.id,
      sectionName: sec.name,
      students: studentSummaries,
      classStats: {
        totalStudents: studentSummaries.length,
        passedStudents: passedCount,
        failedStudents: failedCount,
        passPercentage,
        classAveragePercentage: classAvgPct,
        highestScorePercentage: highestPct
      }
    };
  }

  // -------------------------------------------------------------
  // 6. STUDENT 360 REPORT CARD
  // -------------------------------------------------------------

  async getStudentReportCard(
    schoolId: string,
    examinationId: string,
    studentId: string
  ): Promise<ReportCardResponse> {
    const [school, exam] = await Promise.all([
      this.prisma.school.findUnique({ where: { id: schoolId } }),
      this.getExaminationById(schoolId, examinationId)
    ]);

    if (!school) throw new NotFoundException('School not found');
    if (!exam) throw new NotFoundException('Examination not found');

    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        enrollments: {
          where: { academicYearId: exam.academicYearId },
          include: { class: true, section: true }
        }
      }
    });

    if (!student) throw new NotFoundException('Student not found');

    const enrollment = student.enrollments[0];
    if (!enrollment) {
      throw new BadRequestException('Student is not enrolled in the academic year of this exam');
    }

    // Schedules for this class in this examination
    const schedules = await this.prisma.examSchedule.findMany({
      where: { examinationId, classId: enrollment.classId },
      include: { subject: true },
      orderBy: { examDate: 'asc' }
    });

    // Marks for this student
    const marks = await this.prisma.studentMark.findMany({
      where: {
        studentId,
        examScheduleId: { in: schedules.map((s) => s.id) }
      }
    });

    const markMap = new Map(marks.map((m) => [m.examScheduleId, m]));

    // Grading scale
    const gradingSystems = await this.getGradingSystems(schoolId);
    const scales = gradingSystems[0]?.gradeScales || [];

    let totalMaxMarks = 0;
    let totalObtainedMarks = 0;
    let hasFailedAnySubject = false;
    let totalGradePoints = 0;

    const subjectRows: ReportCardSubjectRow[] = schedules.map((schedule) => {
      const maxMarks = Number(schedule.maxMarks);
      const passingMarks = Number(schedule.passingMarks);
      totalMaxMarks += maxMarks;

      const mark = markMap.get(schedule.id);
      const isAbsent = mark?.isAbsent ?? false;
      const marksObtained = isAbsent || !mark || mark.marksObtained === null ? null : Number(mark.marksObtained);

      let percentage = 0;
      let grade = 'F';
      let gradePoint = 0;
      let status: 'PASS' | 'FAIL' | 'ABSENT' = 'ABSENT';

      if (isAbsent) {
        status = 'ABSENT';
        grade = 'F';
        hasFailedAnySubject = true;
      } else if (marksObtained !== null) {
        totalObtainedMarks += marksObtained;
        percentage = Number(((marksObtained / maxMarks) * 100).toFixed(1));

        const matchedScale = scales.find(
          (s) => percentage >= Number(s.minPercentage) && percentage <= Number(s.maxPercentage)
        );

        grade = matchedScale?.name || 'P';
        gradePoint = matchedScale?.gradePoint ? Number(matchedScale.gradePoint) : 0;
        totalGradePoints += gradePoint;

        status = marksObtained >= passingMarks ? 'PASS' : 'FAIL';
        if (status === 'FAIL') hasFailedAnySubject = true;
      } else {
        status = 'FAIL';
        grade = 'F';
        hasFailedAnySubject = true;
      }

      return {
        subjectId: schedule.subjectId,
        subjectName: schedule.subject.name,
        subjectCode: schedule.subject.code,
        maxMarks,
        passingMarks,
        marksObtained,
        isAbsent,
        percentage,
        grade,
        gradePoint,
        status,
        remarks: mark?.remarks || null
      };
    });

    const aggregatePercentage =
      totalMaxMarks > 0 ? Number(((totalObtainedMarks / totalMaxMarks) * 100).toFixed(1)) : 0;

    const matchedOverallScale = scales.find(
      (s) => aggregatePercentage >= Number(s.minPercentage) && aggregatePercentage <= Number(s.maxPercentage)
    );
    const overallGrade = matchedOverallScale?.name || 'P';
    const overallGpa =
      schedules.length > 0 ? Number((totalGradePoints / schedules.length).toFixed(2)) : 0;

    let overallResult: 'DISTINCTION' | 'FIRST CLASS' | 'SECOND CLASS' | 'PASS' | 'FAIL' = 'FAIL';
    if (!hasFailedAnySubject && aggregatePercentage >= 35) {
      if (aggregatePercentage >= 75) overallResult = 'DISTINCTION';
      else if (aggregatePercentage >= 60) overallResult = 'FIRST CLASS';
      else if (aggregatePercentage >= 50) overallResult = 'SECOND CLASS';
      else overallResult = 'PASS';
    }

    // Compute Class Rank
    const classSummary = await this.getClassSummary(
      schoolId,
      examinationId,
      enrollment.classId,
      enrollment.sectionId
    );
    const rankInfo = classSummary.students.find((s) => s.studentId === studentId);
    const classRank = rankInfo ? rankInfo.classRank : 1;

    // Student Attendance Summary
    const attendanceCount = await this.prisma.attendanceRecord.count({
      where: {
        schoolId,
        studentId,
        academicYearId: exam.academicYearId
      }
    });

    const presentCount = await this.prisma.attendanceRecord.count({
      where: {
        schoolId,
        studentId,
        academicYearId: exam.academicYearId,
        status: { in: ['PRESENT', 'LATE'] }
      }
    });

    const attendancePercentage =
      attendanceCount > 0 ? Number(((presentCount / attendanceCount) * 100).toFixed(1)) : 95.0;

    return {
      school: {
        name: school.name,
        code: school.code,
        address: school.address,
        phone: school.phone,
        email: school.email,
        logoUrl: school.logoUrl
      },
      student: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        rollNumber: enrollment.rollNumber,
        fullName: `${student.firstName} ${student.lastName}`,
        gender: student.gender,
        dateOfBirth: student.dateOfBirth?.toISOString().split('T')[0] || null,
        className: enrollment.class.name,
        sectionName: enrollment.section.name,
        academicYear: exam.academicYear?.name || '2026–2027'
      },
      examination: {
        id: exam.id,
        name: exam.name,
        startDate: exam.startDate.toISOString().split('T')[0],
        endDate: exam.endDate.toISOString().split('T')[0]
      },
      subjects: subjectRows,
      summary: {
        totalMaxMarks,
        totalObtainedMarks,
        aggregatePercentage,
        overallGrade,
        overallGpa,
        classRank,
        totalStudentsInClass: classSummary.students.length,
        overallResult,
        attendancePercentage
      }
    };
  }
}
