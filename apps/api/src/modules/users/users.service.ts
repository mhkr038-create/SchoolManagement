import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async listUsers(schoolId: string, query: { page?: number; limit?: number; search?: string; userType?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { schoolId };
    if (query.userType) {
      where.userType = query.userType;
    }
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    const [totalItems, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          userType: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          userRoles: {
            include: {
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const formattedUsers = users.map((u) => ({
      ...u,
      roles: u.userRoles.map((ur) => ur.role.name)
    }));

    return {
      data: formattedUsers,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNextPage: page * limit < totalItems,
        hasPrevPage: page > 1
      }
    };
  }

  async createUser(schoolId: string, data: {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    phone?: string;
    userType: string;
    roleIds?: string[];
  }) {
    const existing = await this.prisma.user.findFirst({
      where: {
        schoolId,
        email: data.email.toLowerCase().trim()
      }
    });

    if (existing) {
      throw new BadRequestException(`User with email '${data.email}' already exists`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password || 'Welcome123!', salt);

    const user = await this.prisma.user.create({
      data: {
        schoolId,
        email: data.email.toLowerCase().trim(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        userType: data.userType,
        status: 'ACTIVE'
      }
    });

    if (data.roleIds && data.roleIds.length > 0) {
      await this.prisma.userRole.createMany({
        data: data.roleIds.map((roleId) => ({
          userId: user.id,
          roleId
        }))
      });
    }

    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        userType: true,
        status: true,
        createdAt: true,
        userRoles: {
          include: { role: true }
        }
      }
    });
  }

  async getUserById(schoolId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, schoolId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const permissions = new Set<string>();
    const roles: string[] = [];
    for (const ur of user.userRoles) {
      roles.push(ur.role.name);
      for (const rp of ur.role.rolePermissions) {
        permissions.add(rp.permission.code);
      }
    }

    return {
      id: user.id,
      schoolId: user.schoolId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      userType: user.userType,
      status: user.status,
      roles,
      permissions: Array.from(permissions),
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    };
  }
}
