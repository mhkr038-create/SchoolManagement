import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolContextGuard } from '../../common/guards/school-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSchool } from '../../common/decorators/current-school.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('announcements')
@UseGuards(JwtAuthGuard, SchoolContextGuard, PermissionsGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  // -------------------------------------------------------------
  // NOTIFICATIONS (STATIC PATHS)
  // -------------------------------------------------------------

  @Get('notifications')
  async getNotifications(
    @CurrentSchool() schoolId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.announcementsService.getUserNotifications(schoolId, userId);
  }

  @Patch('notifications/read-all')
  async markAllRead(
    @CurrentSchool() schoolId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.announcementsService.markAllNotificationsRead(schoolId, userId);
  }

  @Patch('notifications/:id/read')
  async markRead(
    @CurrentSchool() schoolId: string,
    @Param('id') notificationId: string
  ) {
    return this.announcementsService.markNotificationRead(schoolId, notificationId);
  }

  // -------------------------------------------------------------
  // ANNOUNCEMENTS
  // -------------------------------------------------------------

  @Get()
  @RequirePermissions('announcements.view')
  async listAnnouncements(
    @CurrentSchool() schoolId: string,
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('targetAudience') targetAudience?: string,
    @Query('targetClassId') targetClassId?: string,
    @Query('search') search?: string,
    @Query('schoolId') querySchoolId?: string
  ) {
    const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
    return this.announcementsService.listAnnouncements(
      (isSuperAdmin && querySchoolId) ? querySchoolId : schoolId,
      {
        page,
        limit,
        targetAudience,
        targetClassId,
        search,
        allBranches: isSuperAdmin && (querySchoolId === 'ALL')
      }
    );
  }

  @Post()
  @RequirePermissions('announcements.manage')
  async createAnnouncement(
    @CurrentSchool() schoolId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAnnouncementDto
  ) {
    return this.announcementsService.createAnnouncement(schoolId, userId, dto);
  }

  @Delete(':id')
  @RequirePermissions('announcements.manage')
  async deleteAnnouncement(
    @CurrentSchool() schoolId: string,
    @Param('id') id: string
  ) {
    return this.announcementsService.deleteAnnouncement(schoolId, id);
  }
}