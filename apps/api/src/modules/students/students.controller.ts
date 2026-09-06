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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolContextGuard } from '../../common/guards/school-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSchool } from '../../common/decorators/current-school.decorator';

import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('students')
@UseGuards(JwtAuthGuard, SchoolContextGuard, PermissionsGuard)
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get()
  @RequirePermissions('students.view')
  async listStudents(
    @CurrentUser() user: any,
    @CurrentSchool() schoolId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('status') status?: string,
    @Query('schoolId') querySchoolId?: string
  ) {
    const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
    return this.studentsService.listStudents(
      querySchoolId || schoolId,
      {
        page,
        limit,
        search,
        classId,
        sectionId,
        status,
        allBranches: isSuperAdmin && (querySchoolId === 'ALL')
      },
      isSuperAdmin
    );
  }

  @Post()
  @RequirePermissions('students.create')
  async createStudent(
    @CurrentSchool() schoolId: string,
    @Body() dto: CreateStudentDto
  ) {
    return this.studentsService.createStudent(dto.schoolId || schoolId, dto);
  }

  @Post('bulk-import')
  @RequirePermissions('students.create')
  async bulkImportStudents(
    @CurrentSchool() schoolId: string,
    @Body() body: { students: any[]; targetSchoolId?: string }
  ) {
    const effectiveSchoolId = body.targetSchoolId || schoolId;
    return this.studentsService.bulkImportStudents(effectiveSchoolId, body.students);
  }

  @Get('admission-number/generate')
  @RequirePermissions('students.create')
  async generateAdmissionNumber(
    @CurrentSchool() schoolId: string,
    @Query('schoolId') querySchoolId?: string
  ) {
    const effectiveSchoolId = querySchoolId || schoolId;
    const admissionNumber = await this.studentsService.generateAdmissionNumber(effectiveSchoolId);
    return { admissionNumber };
  }

  @Get(':id')
  @RequirePermissions('students.view')
  async getStudent(
    @CurrentUser() user: any,
    @CurrentSchool() schoolId: string,
    @Param('id') id: string
  ) {
    const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
    return this.studentsService.getStudentById(schoolId, id, isSuperAdmin);
  }

  @Patch(':id')
  @RequirePermissions('students.edit')
  async updateStudent(
    @CurrentUser() user: any,
    @CurrentSchool() schoolId: string,
    @Param('id') id: string,
    @Body() body: any
  ) {
    const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
    return this.studentsService.updateStudent(schoolId, id, body, isSuperAdmin);
  }

  @Post(':id/enroll')
  @RequirePermissions('students.edit')
  async enrollStudent(
    @CurrentSchool() schoolId: string,
    @Param('id') studentId: string,
    @Body() dto: EnrollStudentDto
  ) {
    return this.studentsService.enrollStudent(schoolId, studentId, dto);
  }
}
