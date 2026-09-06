import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class AcademicsService {
  constructor(private prisma: PrismaService) {}

  async listAcademicYears(schoolId: string) {
    return this.prisma.academicYear.findMany({
      where: { schoolId },
      include: { terms: true },
      orderBy: { startDate: 'desc' }
    });
  }

  async listClasses(schoolId: string) {
    return this.prisma.class.findMany({
      where: { schoolId },
      include: {
        sections: {
          include: {
            _count: {
              select: { studentEnrollments: true }
            }
          },
          orderBy: { name: 'asc' }
        },
        classSubjects: {
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            studentEnrollments: true,
            sections: true
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });
  }

  async createClass(schoolId: string, dto: CreateClassDto) {
    const existing = await this.prisma.class.findFirst({
      where: { schoolId, name: dto.name }
    });
    if (existing) {
      throw new BadRequestException(`Class '${dto.name}' already exists`);
    }

    return this.prisma.class.create({
      data: {
        schoolId,
        name: dto.name,
        code: dto.code,
        displayOrder: dto.displayOrder || 0
      },
      include: { sections: true }
    });
  }

  async createSection(schoolId: string, classId: string, dto: CreateSectionDto) {
    const parentClass = await this.prisma.class.findFirst({
      where: { id: classId, schoolId }
    });
    if (!parentClass) {
      throw new NotFoundException('Class not found');
    }

    const existing = await this.prisma.section.findFirst({
      where: { classId, name: dto.name }
    });
    if (existing) {
      throw new BadRequestException(`Section '${dto.name}' already exists in ${parentClass.name}`);
    }

    return this.prisma.section.create({
      data: {
        schoolId,
        classId,
        name: dto.name,
        capacity: dto.capacity || 40
      }
    });
  }

  async listSubjects(schoolId: string) {
    return this.prisma.subject.findMany({
      where: { schoolId },
      orderBy: { name: 'asc' }
    });
  }

  async createSubject(schoolId: string, dto: CreateSubjectDto) {
    const existing = await this.prisma.subject.findFirst({
      where: { schoolId, code: dto.code }
    });
    if (existing) {
      throw new BadRequestException(`Subject with code '${dto.code}' already exists`);
    }

    return this.prisma.subject.create({
      data: {
        schoolId,
        name: dto.name,
        code: dto.code,
        type: dto.type
      }
    });
  }

  async assignSubjectToClass(
    schoolId: string,
    data: { classId: string; subjectId: string; teacherId?: string; creditHours?: number }
  ) {
    return this.prisma.classSubject.upsert({
      where: {
        uq_class_subjects: {
          classId: data.classId,
          subjectId: data.subjectId
        }
      },
      update: {
        teacherId: data.teacherId || null,
        creditHours: data.creditHours || 1.0
      },
      create: {
        schoolId,
        classId: data.classId,
        subjectId: data.subjectId,
        teacherId: data.teacherId || null,
        creditHours: data.creditHours || 1.0
      },
      include: {
        subject: true,
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });
  }
}
