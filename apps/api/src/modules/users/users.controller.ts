import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolContextGuard } from '../../common/guards/school-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentSchool } from '../../common/decorators/current-school.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, SchoolContextGuard, PermissionsGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @RequirePermissions('users.view')
  async listUsers(
    @CurrentSchool() schoolId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('userType') userType?: string
  ) {
    return this.usersService.listUsers(schoolId, { page, limit, search, userType });
  }

  @Post()
  @RequirePermissions('users.create')
  async createUser(
    @CurrentSchool() schoolId: string,
    @Body() body: {
      email: string;
      password?: string;
      firstName: string;
      lastName: string;
      phone?: string;
      userType: string;
      roleIds?: string[];
    }
  ) {
    return this.usersService.createUser(schoolId, body);
  }

  @Get(':id')
  @RequirePermissions('users.view')
  async getUser(
    @CurrentSchool() schoolId: string,
    @Param('id') id: string
  ) {
    return this.usersService.getUserById(schoolId, id);
  }
}
