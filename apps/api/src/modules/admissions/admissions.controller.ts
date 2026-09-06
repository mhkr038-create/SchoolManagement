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
import { AdmissionsService } from './admissions.service';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { ConvertAdmissionDto } from './dto/convert-admission.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolContextGuard } from '../../common/guards/school-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSchool } from '../../common/decorators/current-school.decorator';

@Controller('admissions')
@UseGuards(JwtAuthGuard, SchoolContextGuard, PermissionsGuard)
export class AdmissionsController {
  constructor(private admissionsService: AdmissionsService) {}

  @Get()
  @RequirePermissions('admissions.view')
  async listApplications(
    @CurrentSchool() schoolId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    return this.admissionsService.listApplications(schoolId, {
      page,
      limit,
      status,
      search
    });
  }

  @Post()
  @RequirePermissions('admissions.create')
  async createApplication(
    @CurrentSchool() schoolId: string,
    @Body() dto: CreateAdmissionDto
  ) {
    return this.admissionsService.createApplication(schoolId, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('admissions.approve')
  async updateStatus(
    @CurrentSchool() schoolId: string,
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string }
  ) {
    return this.admissionsService.updateStatus(schoolId, id, body.status, body.notes);
  }

  @Post(':id/convert')
  @RequirePermissions('admissions.approve')
  async convertToStudent(
    @CurrentSchool() schoolId: string,
    @Param('id') applicationId: string,
    @Body() dto: ConvertAdmissionDto
  ) {
    return this.admissionsService.convertToStudent(schoolId, applicationId, dto);
  }
}
