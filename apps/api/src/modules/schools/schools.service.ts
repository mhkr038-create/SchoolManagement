import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SchoolsService {
  constructor(private prisma: PrismaService) {}

  async getPublicSchools() {
    return this.prisma.school.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        code: true,
        name: true,
        domain: true,
        phone: true,
        email: true,
        address: true,
        logoUrl: true,
        currency: true,
        timezone: true,
        status: true,
        _count: {
          select: {
            students: true,
            classes: true
          }
        }
      },
      orderBy: { code: 'asc' }
    });
  }

  async getUserSchools(user: any) {
    const isSuperAdmin =
      user.userType === 'SUPER_ADMIN' ||
      (Array.isArray(user.roles) && user.roles.includes('SUPER_ADMIN'));

    if (isSuperAdmin) {
      return this.prisma.school.findMany({
        where: { status: 'ACTIVE' },
        include: {
          _count: {
            select: {
              students: true,
              classes: true
            }
          }
        },
        orderBy: { code: 'asc' }
      });
    }

    const school = await this.getSchoolProfile(user.schoolId);
    return [school];
  }

  async getSchoolProfile(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: {
            students: true,
            users: true,
            classes: true,
            academicYears: true
          }
        }
      }
    });

    if (!school) {
      throw new NotFoundException('School profile not found');
    }

    return school;
  }

  async updateSchoolProfile(schoolId: string, data: any) {
    return this.prisma.school.update({
      where: { id: schoolId },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        logoUrl: data.logoUrl,
        currency: data.currency,
        timezone: data.timezone
      }
    });
  }
}
