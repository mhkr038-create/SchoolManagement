import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async listAnnouncements(
    schoolId: string,
    params: {
      page?: number;
      limit?: number;
      targetAudience?: string;
      targetClassId?: string;
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
    if (params.targetAudience && params.targetAudience !== 'ALL_FILTER') {
      where.targetAudience = params.targetAudience;
    }
    if (params.targetClassId) {
      where.targetClassId = params.targetClassId;
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [total, announcements] = await Promise.all([
      this.prisma.announcement.count({ where }),
      this.prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        include: {
          author: { select: { id: true, firstName: true, lastName: true, email: true } },
          targetClass: { select: { id: true, name: true, code: true } }
        },
        orderBy: { publishedAt: 'desc' }
      })
    ]);

    return {
      items: announcements.map((a) => ({
        ...a,
        publishedAt: a.publishedAt.toISOString(),
        expiresAt: a.expiresAt ? a.expiresAt.toISOString().split('T')[0] : null
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createAnnouncement(schoolId: string, authorUserId: string, dto: CreateAnnouncementDto) {
    const announcement = await this.prisma.announcement.create({
      data: {
        schoolId,
        title: dto.title,
        content: dto.content,
        targetAudience: dto.targetAudience,
        targetClassId: dto.targetAudience === 'CLASS' ? dto.targetClassId : null,
        publishedBy: authorUserId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        targetClass: { select: { id: true, name: true, code: true } }
      }
    });

    // Fan out in-app notification to users
    try {
      let targetUsers: { id: string }[] = [];
      if (dto.targetAudience === 'TEACHERS') {
        targetUsers = await this.prisma.user.findMany({
          where: { schoolId, userType: { in: ['TEACHER', 'STAFF'] }, status: 'ACTIVE' },
          select: { id: true }
        });
      } else if (dto.targetAudience === 'ALL') {
        targetUsers = await this.prisma.user.findMany({
          where: { schoolId, status: 'ACTIVE' },
          select: { id: true }
        });
      }

      if (targetUsers.length > 0) {
        await this.prisma.notification.createMany({
          data: targetUsers.map((u) => ({
            schoolId,
            userId: u.id,
            title: `Announcement: ${dto.title}`,
            message: dto.content.slice(0, 150),
            type: 'ANNOUNCEMENT',
            linkUrl: '/announcements'
          }))
        });
      }
    } catch (e) {
      // Non-blocking notification fan-out
    }

    return announcement;
  }

  async deleteAnnouncement(schoolId: string, id: string) {
    const existing = await this.prisma.announcement.findFirst({
      where: { id, ...(schoolId !== 'ALL' ? { schoolId } : {}) }
    });
    if (!existing) throw new NotFoundException('Announcement not found');

    return this.prisma.announcement.delete({ where: { id } });
  }

  // -------------------------------------------------------------
  // USER NOTIFICATIONS FEED
  // -------------------------------------------------------------
  async getUserNotifications(schoolId: string, userId: string) {
    const [unreadCount, notifications] = await Promise.all([
      this.prisma.notification.count({
        where: { userId, isRead: false }
      }),
      this.prisma.notification.findMany({
        where: { userId },
        take: 20,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      unreadCount,
      notifications
    };
  }

  async markNotificationRead(schoolId: string, notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() }
    });
  }

  async markAllNotificationsRead(schoolId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });
  }
}