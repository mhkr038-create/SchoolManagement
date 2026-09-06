import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolContextGuard } from '../../common/guards/school-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSchool } from '../../common/decorators/current-school.decorator';

@Controller('rbac')
@UseGuards(JwtAuthGuard, SchoolContextGuard, PermissionsGuard)
export class RbacController {
  constructor(private rbacService: RbacService) {}

  @Get('permissions')
  @RequirePermissions('roles.manage')
  async getPermissions() {
    return this.rbacService.listPermissions();
  }

  @Get('roles')
  @RequirePermissions('roles.manage')
  async getRoles(@CurrentSchool() schoolId: string) {
    return this.rbacService.listRoles(schoolId);
  }

  @Post('roles')
  @RequirePermissions('roles.manage')
  async createRole(
    @CurrentSchool() schoolId: string,
    @Body() body: { name: string; description?: string; permissionIds?: string[] }
  ) {
    return this.rbacService.createRole(
      schoolId,
      body.name,
      body.description,
      body.permissionIds || []
    );
  }

  @Put('roles/:id/permissions')
  @RequirePermissions('roles.manage')
  async updateRolePermissions(
    @CurrentSchool() schoolId: string,
    @Param('id') roleId: string,
    @Body() body: { permissionIds: string[] }
  ) {
    return this.rbacService.updateRolePermissions(
      schoolId,
      roleId,
      body.permissionIds || []
    );
  }
}
