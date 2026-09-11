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

  async updateSchoolProfile(
    schoolId: string,
    data: any,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const existing = await this.prisma.school.findUnique({
      where: { id: schoolId }
    });

    if (!existing) {
      throw new NotFoundException('School profile not found');
    }

    const updated = await this.prisma.school.update({
      where: { id: schoolId },
      data: {
        name: data.name !== undefined ? data.name : existing.name,
        phone: data.phone !== undefined ? data.phone : existing.phone,
        email: data.email !== undefined ? data.email : existing.email,
        address: data.address !== undefined ? data.address : existing.address,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl : existing.logoUrl,
        currency: data.currency !== undefined ? data.currency : existing.currency,
        timezone: data.timezone !== undefined ? data.timezone : existing.timezone,
        domain: data.domain !== undefined ? data.domain : existing.domain
      }
    });

    // Record Audit Log
    try {
      await this.prisma.auditLog.create({
        data: {
          schoolId,
          userId: userId || null,
          entityName: 'School',
          entityId: schoolId,
          action: 'UPDATE',
          oldValues: {
            name: existing.name,
            phone: existing.phone,
            email: existing.email,
            address: existing.address,
            logoUrl: existing.logoUrl,
            currency: existing.currency,
            timezone: existing.timezone
          },
          newValues: {
            name: updated.name,
            phone: updated.phone,
            email: updated.email,
            address: updated.address,
            logoUrl: updated.logoUrl,
            currency: updated.currency,
            timezone: updated.timezone
          },
          ipAddress: ipAddress || '127.0.0.1',
          userAgent: userAgent || 'School ERP System'
        }
      });
    } catch (auditErr) {
      console.warn('Failed to record audit log:', auditErr);
    }

    return updated;
  }

  async getAuditLogs(schoolId: string, query: any = {}) {
    const { action, entityName, userId, startDate, endDate, search, limit = 50, page = 1 } = query;
    const take = Math.min(parseInt(limit as string, 10) || 50, 200);
    const skip = Math.max(((parseInt(page as string, 10) || 1) - 1) * take, 0);

    const where: any = { schoolId };

    if (action && action !== 'ALL') {
      where.action = action;
    }

    if (entityName && entityName !== 'ALL') {
      where.entityName = entityName;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { entityId: { contains: search, mode: 'insensitive' } },
        { entityName: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ]);

    return {
      data: logs,
      meta: {
        total,
        page: parseInt(page as string, 10) || 1,
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    };
  }
}
