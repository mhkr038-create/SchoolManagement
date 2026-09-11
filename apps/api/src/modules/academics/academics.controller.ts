import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import { AcademicsService } from './academics.service';
import { CreateClassDto } from './dto/create-class.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolContextGuard } from '../../common/guards/school-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSchool } from '../../common/decorators/current-school.decorator';

@Controller('academics')
@UseGuards(JwtAuthGuard, SchoolContextGuard, PermissionsGuard)
export class AcademicsController {
  constructor(private academicsService: AcademicsService) {}

  @Get('years')
  @RequirePermissions('academics.view')
  async listYears(@CurrentSchool() schoolId: string) {
    return this.academicsService.listAcademicYears(schoolId);
  }

  @Post('years')
  @RequirePermissions('academics.manage')
  async createYear(
    @CurrentSchool() schoolId: string,
    @Body() body: any
  ) {
    return this.academicsService.createAcademicYear(schoolId, body);
  }

  @Patch('years/:id/set-current')
  @RequirePermissions('academics.manage')
  async setCurrentYear(
    @CurrentSchool() schoolId: string,
    @Param('id') yearId: string
  ) {
    return this.academicsService.setCurrentAcademicYear(schoolId, yearId);
  }

  @Post('years/:id/terms')
  @RequirePermissions('academics.manage')
  async createTerm(
    @CurrentSchool() schoolId: string,
    @Param('id') yearId: string,
    @Body() body: any
  ) {
    return this.academicsService.createAcademicTerm(schoolId, yearId, body);
  }

  @Get('classes')
  @RequirePermissions('academics.view')
  async listClasses(
    @CurrentSchool() schoolId: string,
    @Query('schoolId') querySchoolId?: string
  ) {
    return this.academicsService.listClasses(querySchoolId || schoolId);
  }

  @Post('classes')
  @RequirePermissions('academics.manage')
  async createClass(
    @CurrentSchool() schoolId: string,
    @Body() dto: CreateClassDto
  ) {
    return this.academicsService.createClass(schoolId, dto);
  }

  @Post('classes/:id/sections')
  @RequirePermissions('academics.manage')
  async createSection(
    @CurrentSchool() schoolId: string,
    @Param('id') classId: string,
    @Body() dto: CreateSectionDto
  ) {
    return this.academicsService.createSection(schoolId, classId, dto);
  }

  @Get('subjects')
  @RequirePermissions('academics.view')
  async listSubjects(@CurrentSchool() schoolId: string) {
    return this.academicsService.listSubjects(schoolId);
  }

  @Post('subjects')
  @RequirePermissions('academics.manage')
  async createSubject(
    @CurrentSchool() schoolId: string,
    @Body() dto: CreateSubjectDto
  ) {
    return this.academicsService.createSubject(schoolId, dto);
  }

  @Post('class-subjects/assign')
  @RequirePermissions('academics.manage')
  async assignSubject(
    @CurrentSchool() schoolId: string,
    @Body() body: { classId: string; subjectId: string; teacherId?: string; creditHours?: number }
  ) {
    return this.academicsService.assignSubjectToClass(schoolId, body);
  }
}
