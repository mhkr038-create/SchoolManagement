import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { BatchAttendanceDto } from './dto/batch-attendance.dto';
import { LockAttendanceDto } from './dto/lock-attendance.dto';
import { CorrectAttendanceDto } from './dto/correct-attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolContextGuard } from '../../common/guards/school-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSchool } from '../../common/decorators/current-school.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('attendance')
@UseGuards(JwtAuthGuard, SchoolContextGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Get('sheet')
  @RequirePermissions('attendance.view')
  async getAttendanceSheet(
    @CurrentSchool() schoolId: string,
    @Query('classId') classId: string,
    @Query('sectionId') sectionId: string,
    @Query('date') date: string
  ) {
    if (!classId || !sectionId || !date) {
      throw new BadRequestException('classId, sectionId, and date query parameters are required');
    }
    return this.attendanceService.getAttendanceSheet(schoolId, classId, sectionId, date);
  }

  @Post('batch')
  @RequirePermissions('attendance.mark')
  async batchMarkAttendance(
    @CurrentSchool() schoolId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: BatchAttendanceDto
  ) {
    return this.attendanceService.batchMarkAttendance(schoolId, userId, dto);
  }

  @Post('lock')
  @RequirePermissions('attendance.lock')
  async lockAttendance(
    @CurrentSchool() schoolId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: LockAttendanceDto
  ) {
    return this.attendanceService.lockAttendance(schoolId, userId, dto);
  }

  @Patch(':id')
  @RequirePermissions('attendance.correct')
  async correctAttendance(
    @CurrentSchool() schoolId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CorrectAttendanceDto
  ) {
    return this.attendanceService.correctAttendance(schoolId, userId, id, dto);
  }

  @Get('monthly-report')
  @RequirePermissions('attendance.view')
  async getMonthlyReport(
    @CurrentSchool() schoolId: string,
    @Query('classId') classId: string,
    @Query('sectionId') sectionId: string,
    @Query('month') monthStr: string,
    @Query('year') yearStr: string
  ) {
    if (!classId || !sectionId) {
      throw new BadRequestException('classId and sectionId are required');
    }
    const month = parseInt(monthStr, 10) || new Date().getMonth() + 1;
    const year = parseInt(yearStr, 10) || new Date().getFullYear();

    return this.attendanceService.getMonthlyReport(schoolId, classId, sectionId, month, year);
  }
}
