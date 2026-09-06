import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  async listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }]
    });
  }

  async listRoles(schoolId: string) {
    return this.prisma.role.findMany({
      where: { schoolId },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { userRoles: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createRole(schoolId: string, name: string, description?: string, permissionIds: string[] = []) {
    const existing = await this.prisma.role.findFirst({
      where: { schoolId, name }
    });
    if (existing) {
      throw new BadRequestException(`Role with name '${name}' already exists`);
    }

    const role = await this.prisma.role.create({
      data: {
        schoolId,
        name,
        description,
        isSystemRole: false
      }
    });

    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((pId) => ({
          roleId: role.id,
          permissionId: pId
        }))
      });
    }

    return this.prisma.role.findUnique({
      where: { id: role.id },
      include: {
        rolePermissions: {
          include: { permission: true }
        }
      }
    });
  }

  async updateRolePermissions(schoolId: string, roleId: string, permissionIds: string[]) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, schoolId }
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Atomic sync of permissions
    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((pId) => ({
            roleId,
            permissionId: pId
          }))
        });
      }
    });

    return { message: 'Role permissions updated successfully' };
  }
}
