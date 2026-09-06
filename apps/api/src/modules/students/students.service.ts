import {
  Injectable,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';

function sanitizeForWin1252(str: any): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/\uFFFD/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .normalize('NFKD')
    .replace(/[^\x00-\xFF]/g, '')
    .trim();
}

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async generateAdmissionNumber(schoolId: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const count = await this.prisma.student.count({ where: { schoolId } });
    const seq = String(count + 1).padStart(4, '0');
    return `REMPS-${currentYear}-${seq}`;
  }

  async listStudents(
    schoolId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      classId?: string;
      sectionId?: string;
      status?: string;
      allBranches?: boolean;
    },
    isSuperAdmin: boolean = false
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (!isSuperAdmin || !query.allBranches) {
      if (schoolId && schoolId !== 'ALL') {
        where.schoolId = schoolId;
      }
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      const cleanSearch = sanitizeForWin1252(query.search);
      where.OR = [
        { firstName: { contains: cleanSearch, mode: 'insensitive' } },
        { lastName: { contains: cleanSearch, mode: 'insensitive' } },
        { admissionNumber: { contains: cleanSearch, mode: 'insensitive' } },
        { phone: { contains: cleanSearch, mode: 'insensitive' } }
      ];
    }

    if (query.classId || query.sectionId) {
      where.enrollments = {
        some: {
          ...(query.classId && { classId: query.classId }),
          ...(query.sectionId && { sectionId: query.sectionId })
        }
      };
    }

    const [totalItems, students] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          school: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          enrollments: {
            include: {
              class: true,
              section: true,
              academicYear: true
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          guardians: {
            include: {
              guardian: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const formatted = students.map((s) => ({
      ...s,
      currentEnrollment: s.enrollments[0] || null
    }));

    return {
      data: formatted,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNextPage: page * limit < totalItems,
        hasPrevPage: page > 1
      }
    };
  }

  async createStudent(schoolId: string, dto: CreateStudentDto) {
    const admissionNumber = dto.admissionNumber || (await this.generateAdmissionNumber(schoolId));

    const existing = await this.prisma.student.findFirst({
      where: { schoolId, admissionNumber }
    });
    if (existing) {
      throw new BadRequestException(`Admission number '${admissionNumber}' already exists`);
    }

    // Atomic transaction creating Student, Guardian, and Enrollment
    return this.prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          schoolId,
          admissionNumber,
          firstName: sanitizeForWin1252(dto.firstName),
          middleName: dto.middleName ? sanitizeForWin1252(dto.middleName) : null,
          lastName: dto.lastName ? sanitizeForWin1252(dto.lastName) : '',
          dateOfBirth: new Date(dto.dateOfBirth),
          gender: dto.gender,
          bloodGroup: dto.bloodGroup ? sanitizeForWin1252(dto.bloodGroup) : null,
          phone: dto.phone ? sanitizeForWin1252(dto.phone) : null,
          email: dto.email ? sanitizeForWin1252(dto.email) : null,
          admissionDate: dto.admissionDate ? new Date(dto.admissionDate) : new Date(),
          previousSchool: dto.previousSchool ? sanitizeForWin1252(dto.previousSchool) : null,
          medicalNotes: dto.medicalNotes ? sanitizeForWin1252(dto.medicalNotes) : null,
          status: 'ACTIVE'
        }
      });

      // Optional Guardian creation and link
      if (dto.guardian) {
        const guardian = await tx.guardian.create({
          data: {
            schoolId,
            firstName: sanitizeForWin1252(dto.guardian.firstName),
            lastName: sanitizeForWin1252(dto.guardian.lastName || 'Guardian'),
            relationship: dto.guardian.relationship || 'FATHER',
            phone: sanitizeForWin1252(dto.guardian.phone),
            email: dto.guardian.email ? sanitizeForWin1252(dto.guardian.email) : null,
            occupation: dto.guardian.occupation ? sanitizeForWin1252(dto.guardian.occupation) : 'Guardian',
            address: dto.guardian.address ? sanitizeForWin1252(dto.guardian.address) : null
          }
        });

        await tx.studentGuardian.create({
          data: {
            studentId: student.id,
            guardianId: guardian.id,
            isPrimary: true,
            canPickup: true
          }
        });
      }

      // Optional Enrollment
      if (dto.enrollment) {
        let academicYearId = dto.enrollment.academicYearId;
        if (!academicYearId) {
          const currentYear = await tx.academicYear.findFirst({
            where: { schoolId, isCurrent: true }
          });
          academicYearId = currentYear?.id;
        }

        if (academicYearId) {
          await tx.studentEnrollment.create({
            data: {
              schoolId,
              studentId: student.id,
              academicYearId,
              classId: dto.enrollment.classId,
              sectionId: dto.enrollment.sectionId,
              rollNumber: dto.enrollment.rollNumber || null,
              status: 'ENROLLED'
            }
          });
        }
      }

      return tx.student.findUnique({
        where: { id: student.id },
        include: {
          enrollments: {
            include: { class: true, section: true, academicYear: true }
          },
          guardians: {
            include: { guardian: true }
          }
        }
      });
    });
  }

  async getStudentById(schoolId: string, id: string, isSuperAdmin = false) {
    const whereClause: any = { id };
    if (!isSuperAdmin) {
      whereClause.schoolId = schoolId;
    }

    const student = await this.prisma.student.findFirst({
      where: whereClause,
      include: {
        school: {
          select: { id: true, name: true, code: true }
        },
        enrollments: {
          include: {
            class: true,
            section: true,
            academicYear: true
          },
          orderBy: { createdAt: 'desc' }
        },
        guardians: {
          include: {
            guardian: true
          }
        },
        attendanceRecords: {
          take: 10,
          orderBy: { date: 'desc' }
        },
        feeInvoices: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!student) {
      throw new NotFoundException('Student record not found');
    }

    return {
      ...student,
      currentEnrollment: student.enrollments[0] || null
    };
  }

  async updateStudent(schoolId: string, id: string, data: any, isSuperAdmin = false) {
    const whereClause: any = { id };
    if (!isSuperAdmin) {
      whereClause.schoolId = schoolId;
    }
    const student = await this.prisma.student.findFirst({ where: whereClause });
    if (!student) {
      throw new NotFoundException('Student record not found');
    }

    return this.prisma.student.update({
      where: { id },
      data: {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        bloodGroup: data.bloodGroup,
        phone: data.phone,
        email: data.email,
        previousSchool: data.previousSchool,
        medicalNotes: data.medicalNotes,
        status: data.status
      }
    });
  }

  async enrollStudent(schoolId: string, studentId: string, dto: EnrollStudentDto) {
    let academicYearId = dto.academicYearId;
    if (!academicYearId) {
      const currentYear = await this.prisma.academicYear.findFirst({
        where: { schoolId, isCurrent: true }
      });
      academicYearId = currentYear?.id;
    }

    if (!academicYearId) {
      throw new BadRequestException('Active academic year not found');
    }

    return this.prisma.studentEnrollment.upsert({
      where: {
        uq_student_enrollment: {
          schoolId,
          studentId,
          academicYearId
        }
      },
      update: {
        classId: dto.classId,
        sectionId: dto.sectionId,
        rollNumber: dto.rollNumber || null
      },
      create: {
        schoolId,
        studentId,
        academicYearId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        rollNumber: dto.rollNumber || null,
        status: 'ENROLLED'
      },
      include: {
        class: true,
        section: true,
        academicYear: true
      }
    });
  }

  async bulkImportStudents(schoolId: string, items: any[]) {
    if (!items || items.length === 0) {
      throw new BadRequestException('No student records provided for import');
    }

    const allSchools = await this.prisma.school.findMany({
      select: { id: true, name: true, code: true }
    });

    const schoolMap = new Map<string, string>();
    for (const sch of allSchools) {
      schoolMap.set(sch.id.toLowerCase(), sch.id);
      schoolMap.set(sch.code.toLowerCase(), sch.id);
      schoolMap.set(sch.name.toLowerCase(), sch.id);
      if (sch.code.includes('MAIN')) {
        schoolMap.set('main', sch.id);
        schoolMap.set('main campus', sch.id);
        schoolMap.set('remps-main', sch.id);
      }
      if (sch.code.includes('CITY')) {
        schoolMap.set('city', sch.id);
        schoolMap.set('city campus', sch.id);
        schoolMap.set('remps-city', sch.id);
      }
    }

    // Build context caches per school (academic year, class map, student count)
    const schoolContexts = new Map<string, { activeYear: any; classMap: Map<string, any>; currentCount: number }>();
    for (const sch of allSchools) {
      const [activeYear, allClasses, count] = await Promise.all([
        this.prisma.academicYear.findFirst({ where: { schoolId: sch.id, isCurrent: true } }),
        this.prisma.class.findMany({ where: { schoolId: sch.id }, include: { sections: true } }),
        this.prisma.student.count({ where: { schoolId: sch.id } })
      ]);

      const classMap = new Map<string, any>();
      for (const c of allClasses) {
        const lowerName = c.name.toLowerCase().trim();
        classMap.set(lowerName, c);
        if (c.code) classMap.set(c.code.toLowerCase().trim(), c);

        const numMatch = lowerName.match(/\d+/);
        if (numMatch) {
          const num = numMatch[0];
          classMap.set(num, c);
          classMap.set(`${num}st`, c);
          classMap.set(`${num}nd`, c);
          classMap.set(`${num}rd`, c);
          classMap.set(`${num}th`, c);
          classMap.set(`class-${num}`, c);
          classMap.set(`grade ${num}`, c);
          classMap.set(`std ${num}`, c);
        }
        if (lowerName.includes('nursery')) classMap.set('nursery', c);
        if (lowerName.includes('lkg')) classMap.set('lkg', c);
        if (lowerName.includes('ukg')) classMap.set('ukg', c);
      }

      schoolContexts.set(sch.id, { activeYear, classMap, currentCount: count });
    }

    const currentYear = new Date().getFullYear();

    const parseFlexibleDate = (val: any): Date => {
      if (!val) return new Date('2020-01-01');
      if (val instanceof Date && !isNaN(val.getTime())) return val;
      if (typeof val === 'number') {
        return new Date(Math.round((val - 25569) * 86400 * 1000));
      }
      const str = String(val).trim();
      if (!str) return new Date('2020-01-01');

      if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(str)) {
        const parts = str.split(/[-/.]/);
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (!isNaN(d.getTime())) return d;
      }
      if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(str)) {
        const parts = str.split(/[-/.]/);
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        if (!isNaN(d.getTime())) return d;
      }
      const d = new Date(str);
      return isNaN(d.getTime()) ? new Date('2020-01-01') : d;
    };

    const parseGender = (val: any): string => {
      if (!val) return 'MALE';
      const s = String(val).trim().toUpperCase();
      if (s.startsWith('F') || s === 'GIRL' || s === 'WOMAN') return 'FEMALE';
      if (s.startsWith('O')) return 'OTHER';
      return 'MALE';
    };

    return this.prisma.$transaction(async (tx) => {
      let imported = 0;

      for (const item of items) {
        // Resolve student's branch/school
        let targetSchoolId = schoolId;
        const branchVal = item.branch || item.campus || item.school || item.branchCode;
        if (branchVal) {
          const matched = schoolMap.get(String(branchVal).toLowerCase().trim());
          if (matched) targetSchoolId = matched;
        }

        const ctx = schoolContexts.get(targetSchoolId) || schoolContexts.get(schoolId);
        const targetSchool = allSchools.find((s) => s.id === targetSchoolId) || allSchools[0];
        const schoolCodePrefix = targetSchool?.code ? targetSchool.code.split('-')[0] : 'REMPS';

        if (ctx) ctx.currentCount++;
        const seqNum = ctx ? ctx.currentCount : ++imported;
        const admissionNumber = `${schoolCodePrefix}-${currentYear}-${String(seqNum).padStart(4, '0')}`;

        const rawDob = parseFlexibleDate(item.dateOfBirth);
        const rawGender = parseGender(item.gender);

        const student = await tx.student.create({
          data: {
            schoolId: targetSchoolId,
            admissionNumber,
            firstName: sanitizeForWin1252(item.firstName || 'Student'),
            lastName: sanitizeForWin1252(item.lastName || ''),
            dateOfBirth: rawDob,
            gender: rawGender,
            bloodGroup: sanitizeForWin1252(item.bloodGroup || 'O+'),
            phone: sanitizeForWin1252(item.phone) || null,
            email: sanitizeForWin1252(item.email) || null,
            admissionDate: new Date(),
            status: 'ACTIVE'
          }
        });

        // Guardian linkage
        if (item.parentName && String(item.parentName).trim()) {
          const rawParent = sanitizeForWin1252(item.parentName);
          const names = rawParent.split(' ');
          const gFirstName = sanitizeForWin1252(names[0] || 'Parent');
          const gLastName = sanitizeForWin1252(names.slice(1).join(' ') || 'Guardian');

          const parentRel = String(item.parentRelationship || 'FATHER').toUpperCase();
          const pRelNormalized = parentRel.includes('MOTH') ? 'MOTHER' : parentRel.includes('GUAR') ? 'GUARDIAN' : 'FATHER';

          const guardian = await tx.guardian.create({
            data: {
              schoolId: targetSchoolId,
              firstName: gFirstName,
              lastName: gLastName,
              relationship: pRelNormalized,
              phone: sanitizeForWin1252(item.parentPhone || item.phone || '000-000-0000'),
              occupation: 'Guardian'
            }
          });

          await tx.studentGuardian.create({
            data: {
              studentId: student.id,
              guardianId: guardian.id,
              isPrimary: true,
              canPickup: true
            }
          });
        }

        // Enrollment
        if (ctx?.activeYear) {
          const targetClassKey = (item.className || '').toLowerCase().trim();
          let matchedClass = ctx.classMap.get(targetClassKey);

          if (!matchedClass && targetClassKey) {
            const numPart = targetClassKey.match(/\d+/);
            if (numPart) matchedClass = ctx.classMap.get(numPart[0]);
          }

          if (matchedClass && matchedClass.sections && matchedClass.sections.length > 0) {
            let matchedSection = matchedClass.sections[0];
            if (item.sectionName) {
              const secQuery = String(item.sectionName).toLowerCase().replace(/section|sec/g, '').trim();
              const secFound = matchedClass.sections.find(
                (s: any) => s.name.toLowerCase().trim() === secQuery || s.name.toLowerCase().trim() === String(item.sectionName).toLowerCase().trim()
              );
              if (secFound) matchedSection = secFound;
            }

            if (matchedSection) {
              const rollNum = item.rollNumber ? parseInt(String(item.rollNumber).replace(/[^\d]/g, ''), 10) : null;
              await tx.studentEnrollment.create({
                data: {
                  schoolId: targetSchoolId,
                  studentId: student.id,
                  academicYearId: ctx.activeYear.id,
                  classId: matchedClass.id,
                  sectionId: matchedSection.id,
                  rollNumber: rollNum && !isNaN(rollNum) ? rollNum : null,
                  status: 'ENROLLED'
                }
              });
            }
          }
        }

        imported++;
      }

      return {
        success: true,
        importedCount: imported,
        failedCount: 0,
        errors: [],
        message: `Successfully imported ${imported} students with guardians and class enrollments.`
      };
    });
  }
}
