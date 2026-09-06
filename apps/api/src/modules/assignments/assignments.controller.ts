import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolContextGuard } from '../../common/guards/school-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSchool } from '../../common/decorators/current-school.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('assignments')
@UseGuards(JwtAuthGuard, SchoolContextGuard, PermissionsGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  // -------------------------------------------------------------
  // STATIC PATHS (MUST PRECEDE PARAMETRIZED PATHS)
  // -------------------------------------------------------------

  @Get('stats')
  @RequirePermissions('assignments.view')
  async getAssignmentStats(
    @CurrentSchool() schoolId: string,
    @CurrentUser() user: any,
    @Query('schoolId') querySchoolId?: string
  ) {
    const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
    return this.assignmentsService.getAssignmentStats(
      (isSuperAdmin && querySchoolId) ? querySchoolId : schoolId,
      isSuperAdmin
    );
  }

  @Get()
  @RequirePermissions('assignments.view')
  async listAssignments(
    @CurrentSchool() schoolId: string,
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('classId') classId?: string,
    @Query('sectionId') sectionId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('search') search?: string,
    @Query('schoolId') querySchoolId?: string
  ) {
    const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
    return this.assignmentsService.listAssignments(
      (isSuperAdmin && querySchoolId) ? querySchoolId : schoolId,
      {
        page,
        limit,
        classId,
        sectionId,
        subjectId,
        teacherId,
        search,
        allBranches: isSuperAdmin && (querySchoolId === 'ALL')
      }
    );
  }

  @Post()
  @RequirePermissions('assignments.manage')
  async createAssignment(
    @CurrentSchool() schoolId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAssignmentDto
  ) {
    return this.assignmentsService.createAssignment(schoolId, userId, dto);
  }

  @Post('submit')
  @RequirePermissions('assignments.view')
  async submitHomework(
    @CurrentSchool() schoolId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitAssignmentDto,
    @Query('studentId') queryStudentId?: string
  ) {
    // If teacher/admin submitting on behalf of a student, or student self-submitting
    const studentId = queryStudentId || userId;
    return this.assignmentsService.submitHomework(schoolId, studentId, dto);
  }

  @Post('submissions/:submissionId/grade')
  @RequirePermissions('assignments.manage')
  async gradeSubmission(
    @CurrentSchool() schoolId: string,
    @CurrentUser('id') graderUserId: string,
    @Param('submissionId') submissionId: string,
    @Body() dto: GradeSubmissionDto
  ) {
    return this.assignmentsService.gradeSubmission(schoolId, graderUserId, submissionId, dto);
  }

  @Get(':id')
  @RequirePermissions('assignments.view')
  async getAssignment(
    @CurrentSchool() schoolId: string,
    @Param('id') id: string
  ) {
    return this.assignmentsService.getAssignmentById(schoolId, id);
  }

  @Delete(':id')
  @RequirePermissions('assignments.manage')
  async deleteAssignment(
    @CurrentSchool() schoolId: string,
    @Param('id') id: string
  ) {
    return this.assignmentsService.deleteAssignment(schoolId, id);
  }
}