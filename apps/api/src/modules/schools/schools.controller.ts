import {
  Controller,
  Get,
  Patch,
  Body,
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
    @Body() body: any
  ) {
    return this.schoolsService.updateSchoolProfile(schoolId, body);
  }
}
