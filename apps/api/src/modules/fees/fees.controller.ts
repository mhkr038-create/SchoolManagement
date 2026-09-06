import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import { FeesService } from './fees.service';
import { CreateFeeCategoryDto } from './dto/create-fee-category.dto';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { GenerateInvoicesDto } from './dto/generate-invoices.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolContextGuard } from '../../common/guards/school-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSchool } from '../../common/decorators/current-school.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('fees')
@UseGuards(JwtAuthGuard, SchoolContextGuard, PermissionsGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  // -------------------------------------------------------------
  // STATIC PATHS (MUST PRECEDE PARAMETRIZED PATHS)
  // -------------------------------------------------------------

  @Get('stats')
  @RequirePermissions('fees.view')
  async getFeeStats(
    @CurrentSchool() schoolId: string,
    @CurrentUser() user: any,
    @Query('schoolId') querySchoolId?: string
  ) {
    const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
    const effectiveSchoolId = (isSuperAdmin && querySchoolId) ? querySchoolId : schoolId;
    return this.feesService.getFeeStats(effectiveSchoolId, isSuperAdmin);
  }

  @Get('categories')
  @RequirePermissions('fees.view')
  async listCategories(
    @CurrentSchool() schoolId: string,
    @CurrentUser() user: any,
    @Query('schoolId') querySchoolId?: string
  ) {
    const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
    return this.feesService.listCategories((isSuperAdmin && querySchoolId) ? querySchoolId : schoolId);
  }

  @Post('categories')
  @RequirePermissions('fees.manage')
  async createCategory(
    @CurrentSchool() schoolId: string,
    @Body() dto: CreateFeeCategoryDto
  ) {
    return this.feesService.createCategory(schoolId, dto);
  }

  @Delete('categories/:id')
  @RequirePermissions('fees.manage')
  async deleteCategory(
    @CurrentSchool() schoolId: string,
    @Param('id') id: string
  ) {
    return this.feesService.deleteCategory(schoolId, id);
  }

  @Get('structures')
  @RequirePermissions('fees.view')
  async listStructures(
    @CurrentSchool() schoolId: string,
    @CurrentUser() user: any,
    @Query('classId') classId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('schoolId') querySchoolId?: string
  ) {
    const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
    return this.feesService.listStructures(
      (isSuperAdmin && querySchoolId) ? querySchoolId : schoolId,
      classId,
      academicYearId
    );
  }

  @Post('structures')
  @RequirePermissions('fees.manage')
  async createStructure(
    @CurrentSchool() schoolId: string,
    @Body() dto: CreateFeeStructureDto
  ) {
    return this.feesService.createStructure(schoolId, dto);
  }

  @Get('invoices')
  @RequirePermissions('fees.view')
  async listInvoices(
    @CurrentSchool() schoolId: string,
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('classId') classId?: string,
    @Query('status') status?: string,
    @Query('studentId') studentId?: string,
    @Query('schoolId') querySchoolId?: string
  ) {
    const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
    return this.feesService.listInvoices(
      (isSuperAdmin && querySchoolId) ? querySchoolId : schoolId,
      {
        page,
        limit,
        search,
        classId,
        status,
        studentId,
        allBranches: isSuperAdmin && (querySchoolId === 'ALL')
      }
    );
  }

  @Post('invoices/generate')
  @RequirePermissions('fees.manage')
  async bulkGenerateInvoices(
    @CurrentSchool() schoolId: string,
    @Body() dto: GenerateInvoicesDto
  ) {
    return this.feesService.bulkGenerateInvoices(schoolId, dto);
  }

  @Get('invoices/:id')
  @RequirePermissions('fees.view')
  async getInvoice(
    @CurrentSchool() schoolId: string,
    @Param('id') id: string
  ) {
    return this.feesService.getInvoiceById(schoolId, id);
  }

  @Post('payments')
  @RequirePermissions('fees.collect')
  async recordPayment(
    @CurrentSchool() schoolId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RecordPaymentDto
  ) {
    return this.feesService.recordPayment(schoolId, userId, dto);
  }

  @Get('payments')
  @RequirePermissions('fees.view')
  async listPayments(
    @CurrentSchool() schoolId: string,
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('studentId') studentId?: string,
    @Query('schoolId') querySchoolId?: string
  ) {
    const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
    return this.feesService.listPayments(
      (isSuperAdmin && querySchoolId) ? querySchoolId : schoolId,
      {
        page,
        limit,
        studentId,
        allBranches: isSuperAdmin && (querySchoolId === 'ALL')
      }
    );
  }

  @Get('receipts/:receiptId')
  @RequirePermissions('fees.view')
  async getReceiptDetails(
    @CurrentSchool() schoolId: string,
    @Param('receiptId') receiptId: string
  ) {
    return this.feesService.getReceiptDetails(schoolId, receiptId);
  }
}