import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException
} from '@nestjs/common';
import { ExaminationsService } from './examinations.service';
import { CreateExaminationDto, UpdateExaminationDto } from './dto/create-examination.dto';
import { CreateExamScheduleDto } from './dto/create-schedule.dto';
import { BatchMarkEntryDto } from './dto/batch-marks.dto';
import { LockMarksDto } from './dto/lock-marks.dto';
import { CreateGradingSystemDto } from './dto/create-grading-system.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolContextGuard } from '../../common/guards/school-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSchool } from '../../common/decorators/current-school.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('examinations')
@UseGuards(JwtAuthGuard, SchoolContextGuard, PermissionsGuard)
export class ExaminationsController {
  constructor(private readonly examsService: ExaminationsService) {}

  // -------------------------------------------------------------
  // STATIC PATHS (MUST PRECEDE PARAMETRIZED PATHS)
  // -------------------------------------------------------------

  @Get('grading-systems')
  @RequirePermissions('exams.view')
  async getGradingSystems(@CurrentSchool() schoolId: string) {
    return this.examsService.getGradingSystems(schoolId);
  }

  @Post('grading-systems')
  @RequirePermissions('exams.manage')
  async createGradingSystem(
    @CurrentSchool() schoolId: string,
    @Body() dto: CreateGradingSystemDto
  ) {
    return this.examsService.createGradingSystem(schoolId, dto);
  }

  @Get('marks/sheet')
  @RequirePermissions('exams.view')
  async getMarkSheet(
    @CurrentSchool() schoolId: string,
    @Query('examScheduleId') examScheduleId: string,
    @Query('sectionId') sectionId: string
  ) {
    if (!examScheduleId || !sectionId) {
      throw new BadRequestException('examScheduleId and sectionId query parameters are required');
    }
    return this.examsService.getMarkSheet(schoolId, examScheduleId, sectionId);
  }

  @Post('marks/batch')
  @RequirePermissions('marks.enter')
  async batchSaveMarks(
    @CurrentSchool() schoolId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('permissions') permissions: string[] = [],
    @Body() dto: BatchMarkEntryDto
  ) {
    const canBypassLock = permissions.includes('marks.lock');
    return this.examsService.batchSaveMarks(schoolId, userId, dto, canBypassLock);
  }

  @Post('marks/lock')
  @RequirePermissions('marks.lock')
  async lockMarks(
    @CurrentSchool() schoolId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: LockMarksDto
  ) {
    return this.examsService.lockMarks(schoolId, userId, dto);
  }

  @Delete('schedules/:scheduleId')
  @RequirePermissions('exams.manage')
  async deleteSchedule(
    @CurrentSchool() schoolId: string,
    @Param('scheduleId') scheduleId: string
  ) {
    return this.examsService.deleteSchedule(schoolId, scheduleId);
  }

  // -------------------------------------------------------------
  // EXAMINATIONS LIST & CREATION
  // -------------------------------------------------------------

  @Get()
  @RequirePermissions('exams.view')
  async getExaminations(
    @CurrentSchool() schoolId: string,
    @Query('academicYearId') academicYearId?: string
  ) {
    return this.examsService.getExaminations(schoolId, academicYearId);
  }

  @Post()
  @RequirePermissions('exams.manage')
  async createExamination(
    @CurrentSchool() schoolId: string,
    @Body() dto: CreateExaminationDto
  ) {
    return this.examsService.createExamination(schoolId, dto);
  }

  // -------------------------------------------------------------
  // PARAMETRIZED EXAMINATION PATHS
  // -------------------------------------------------------------

  @Get(':id')
  @RequirePermissions('exams.view')
  async getExaminationById(
    @CurrentSchool() schoolId: string,
    @Param('id') id: string
  ) {
    return this.examsService.getExaminationById(schoolId, id);
  }

  @Put(':id')
  @RequirePermissions('exams.manage')
  async updateExamination(
    @CurrentSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExaminationDto
  ) {
    return this.examsService.updateExamination(schoolId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('exams.manage')
  async deleteExamination(
    @CurrentSchool() schoolId: string,
    @Param('id') id: string
  ) {
    return this.examsService.deleteExamination(schoolId, id);
  }

  @Post(':id/schedules')
  @RequirePermissions('exams.manage')
  async createSchedule(
    @CurrentSchool() schoolId: string,
    @Param('id') examinationId: string,
    @Body() dto: CreateExamScheduleDto
  ) {
    return this.examsService.createSchedule(schoolId, examinationId, dto);
  }

  @Get(':id/class-summary')
  @RequirePermissions('exams.view')
  async getClassSummary(
    @CurrentSchool() schoolId: string,
    @Param('id') examinationId: string,
    @Query('classId') classId: string,
    @Query('sectionId') sectionId: string
  ) {
    if (!classId || !sectionId) {
      throw new BadRequestException('classId and sectionId query parameters are required');
    }
    return this.examsService.getClassSummary(schoolId, examinationId, classId, sectionId);
  }

  @Get(':id/report-card/:studentId')
  @RequirePermissions('exams.view')
  async getStudentReportCard(
    @CurrentSchool() schoolId: string,
    @Param('id') examinationId: string,
    @Param('studentId') studentId: string
  ) {
    return this.examsService.getStudentReportCard(schoolId, examinationId, studentId);
  }
}
