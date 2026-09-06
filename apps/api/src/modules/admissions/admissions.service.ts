import {
  Injectable,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StudentsService } from '../students/students.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { ConvertAdmissionDto } from './dto/convert-admission.dto';

@Injectable()
export class AdmissionsService {
  constructor(
    private prisma: PrismaService,
    private studentsService: StudentsService
  ) {}

  async generateApplicationNo(schoolId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.admissionApplication.count({ where: { schoolId } });
    const seq = String(count + 1).padStart(3, '0');
    return `APP-${year}-${seq}`;
  }

  async listApplications(
    schoolId: string,
    query: { page?: number; limit?: number; status?: string; search?: string }
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { schoolId };
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { applicationNo: { contains: query.search, mode: 'insensitive' } },
        { parentName: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    const [totalItems, items] = await Promise.all([
      this.prisma.admissionApplication.count({ where }),
      this.prisma.admissionApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Attach applying class details
    const classIds = Array.from(new Set(items.map((i) => i.applyingForClassId)));
    const classes = await this.prisma.class.findMany({
      where: { id: { in: classIds } }
    });
    const classMap = new Map(classes.map((c) => [c.id, c]));

    const formatted = items.map((app) => ({
      ...app,
      applyingClass: classMap.get(app.applyingForClassId) || null
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

  async createApplication(schoolId: string, dto: CreateAdmissionDto) {
    const applicationNo = await this.generateApplicationNo(schoolId);

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

    return this.prisma.admissionApplication.create({
      data: {
        schoolId,
        applicationNo,
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        applyingForClassId: dto.applyingForClassId,
        academicYearId,
        parentName: dto.parentName,
        parentPhone: dto.parentPhone,
        parentEmail: dto.parentEmail,
        address: dto.address,
        previousSchool: dto.previousSchool,
        status: 'SUBMITTED',
        notes: dto.notes
      }
    });
  }

  async updateStatus(schoolId: string, id: string, status: string, notes?: string) {
    const app = await this.prisma.admissionApplication.findFirst({
      where: { id, schoolId }
    });
    if (!app) {
      throw new NotFoundException('Admission application not found');
    }

    return this.prisma.admissionApplication.update({
      where: { id },
      data: {
        status,
        ...(notes && { notes })
      }
    });
  }

  async convertToStudent(schoolId: string, applicationId: string, dto: ConvertAdmissionDto) {
    const app = await this.prisma.admissionApplication.findFirst({
      where: { id: applicationId, schoolId }
    });

    if (!app) {
      throw new NotFoundException('Admission application not found');
    }

    if (app.status === 'ENROLLED') {
      throw new BadRequestException('Applicant is already enrolled as a student');
    }

    const admissionNumber = await this.studentsService.generateAdmissionNumber(schoolId);
    let academicYearId = dto.academicYearId || app.academicYearId;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Student
      const student = await tx.student.create({
        data: {
          schoolId,
          admissionNumber,
          firstName: app.firstName,
          middleName: app.middleName,
          lastName: app.lastName,
          dateOfBirth: app.dateOfBirth,
          gender: app.gender,
          phone: app.parentPhone,
          email: app.parentEmail,
          admissionDate: new Date(),
          previousSchool: app.previousSchool,
          medicalNotes: app.notes,
          status: 'ACTIVE'
        }
      });

      // 2. Create Guardian
      const names = app.parentName.split(' ');
      const guardian = await tx.guardian.create({
        data: {
          schoolId,
          firstName: names[0] || 'Parent',
          lastName: names.slice(1).join(' ') || 'Guardian',
          relationship: 'GUARDIAN',
          phone: app.parentPhone,
          email: app.parentEmail,
          address: app.address
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

      // 3. Create Enrollment
      const enrollment = await tx.studentEnrollment.create({
        data: {
          schoolId,
          studentId: student.id,
          academicYearId,
          classId: dto.classId,
          sectionId: dto.sectionId,
          rollNumber: dto.rollNumber || null,
          status: 'ENROLLED'
        },
        include: {
          class: true,
          section: true
        }
      });

      // 4. Update Application status to ENROLLED
      await tx.admissionApplication.update({
        where: { id: applicationId },
        data: {
          status: 'ENROLLED',
          studentId: student.id
        }
      });

      return {
        student,
        enrollment,
        admissionNumber
      };
    });
  }
}
