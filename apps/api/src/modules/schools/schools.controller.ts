import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolContextGuard } from '../../common/guards/school-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSchool } from '../../common/decorators/current-school.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('schools')
export class SchoolsController {
  constructor(private schoolsService: SchoolsService) {}

  @Get('public')
  async getPublicSchools() {
    return this.schoolsService.getPublicSchools();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserSchools(@CurrentUser() user: any) {
    return this.schoolsService.getUserSchools(user);
  }

  @Get('current')
  @UseGuards(JwtAuthGuard, SchoolContextGuard, PermissionsGuard)
  @RequirePermissions('school.settings.view')
  async getCurrentSchool(@CurrentSchool() schoolId: string) {
    return this.schoolsService.getSchoolProfile(schoolId);
  }

  @Patch('current')
  @UseGuards(JwtAuthGuard, SchoolContextGuard, PermissionsGuard)
  @RequirePermissions('school.settings.edit')
  async updateCurrentSchool(
    @CurrentSchool() schoolId: string,
    @CurrentUser() user: any,
    @Req() req: any,
    @Body() body: any
  ) {
    const ip = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'School ERP';
    return this.schoolsService.updateSchoolProfile(schoolId, body, user?.id, ip, userAgent);
  }

  @Get('audit-logs')
  @UseGuards(JwtAuthGuard, SchoolContextGuard, PermissionsGuard)
  @RequirePermissions('school.settings.view')
  async getAuditLogs(
    @CurrentSchool() schoolId: string,
    @Query() query: any
  ) {
    return this.schoolsService.getAuditLogs(schoolId, query);
  }
}
