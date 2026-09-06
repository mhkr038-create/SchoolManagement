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
import { TimetableService } from './timetable.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateTimetableEntryDto } from './dto/create-timetable-entry.dto';
import { BatchTimetableDto } from './dto/batch-timetable.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolContextGuard } from '../../common/guards/school-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSchool } from '../../common/decorators/current-school.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('timetable')
@UseGuards(JwtAuthGuard, SchoolContextGuard, PermissionsGuard)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  // -------------------------------------------------------------
  // STATIC PATHS (MUST PRECEDE PARAMETRIZED PATHS)
  // -------------------------------------------------------------

  @Get('rooms')
  @RequirePermissions('timetable.view')
  async listRooms(
    @CurrentSchool() schoolId: string,
    @CurrentUser() user: any,
    @Query('schoolId') querySchoolId?: string
  ) {
    const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
    return this.timetableService.listRooms((isSuperAdmin && querySchoolId) ? querySchoolId : schoolId);
  }

  @Post('rooms')
  @RequirePermissions('timetable.manage')
  async createRoom(
    @CurrentSchool() schoolId: string,
    @Body() dto: CreateRoomDto
  ) {
    return this.timetableService.createRoom(schoolId, dto);
  }

  @Delete('rooms/:id')
  @RequirePermissions('timetable.manage')
  async deleteRoom(
    @CurrentSchool() schoolId: string,
    @Param('id') id: string
  ) {
    return this.timetableService.deleteRoom(schoolId, id);
  }

  @Get('section/:sectionId')
  @RequirePermissions('timetable.view')
  async getSectionTimetable(
    @CurrentSchool() schoolId: string,
    @CurrentUser() user: any,
    @Param('sectionId') sectionId: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('schoolId') querySchoolId?: string
  ) {
    const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
    return this.timetableService.getSectionTimetable(
      (isSuperAdmin && querySchoolId) ? querySchoolId : schoolId,
      sectionId,
      academicYearId
    );
  }

  @Get('teacher/:teacherId')
  @RequirePermissions('timetable.view')
  async getTeacherTimetable(
    @CurrentSchool() schoolId: string,
    @CurrentUser() user: any,
    @Param('teacherId') teacherId: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('schoolId') querySchoolId?: string
  ) {
    const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
    return this.timetableService.getTeacherTimetable(
      (isSuperAdmin && querySchoolId) ? querySchoolId : schoolId,
      teacherId,
      academicYearId
    );
  }

  @Post('check-conflict')
  @RequirePermissions('timetable.view')
  async checkConflict(
    @CurrentSchool() schoolId: string,
    @Body() body: any
  ) {
    return this.timetableService.checkConflicts(schoolId, body);
  }

  @Post('entries')
  @RequirePermissions('timetable.manage')
  async createEntry(
    @CurrentSchool() schoolId: string,
    @Body() dto: CreateTimetableEntryDto
  ) {
    return this.timetableService.createEntry(schoolId, dto);
  }

  @Put('entries/:id')
  @RequirePermissions('timetable.manage')
  async updateEntry(
    @CurrentSchool() schoolId: string,
    @Param('id') id: string,
    @Body() dto: CreateTimetableEntryDto
  ) {
    return this.timetableService.updateEntry(schoolId, id, dto);
  }

  @Delete('entries/:id')
  @RequirePermissions('timetable.manage')
  async deleteEntry(
    @CurrentSchool() schoolId: string,
    @Param('id') id: string
  ) {
    return this.timetableService.deleteEntry(schoolId, id);
  }

  @Post('batch')
  @RequirePermissions('timetable.manage')
  async saveBatch(
    @CurrentSchool() schoolId: string,
    @Body() dto: BatchTimetableDto
  ) {
    return this.timetableService.saveBatch(schoolId, dto);
  }
}