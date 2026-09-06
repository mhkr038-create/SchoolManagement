import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    // 1. Resolve school if schoolCode provided, or lookup user by email
    let userQuery: any = { email: dto.email.toLowerCase().trim() };

    if (dto.schoolCode) {
      const codeLookup = dto.schoolCode.trim() === 'REMPS-2026' ? 'REMPS-MAIN' : dto.schoolCode.trim();
      const school = await this.prisma.school.findUnique({
        where: { code: codeLookup }
      });
      if (school) {
        userQuery = {
          schoolId: school.id,
          email: dto.email.toLowerCase().trim()
        };
      } else {
        // If school not found, verify if user is Super Admin before rejecting
        const maybeSuperAdmin = await this.prisma.user.findFirst({
          where: { email: dto.email.toLowerCase().trim(), userType: 'SUPER_ADMIN' }
        });
        if (!maybeSuperAdmin) {
          throw new BadRequestException(`School code '${dto.schoolCode}' not found`);
        }
      }
    }

    const user = await this.prisma.user.findFirst({
      where: userQuery,
      include: {
        school: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(`Your account is ${user.status.toLowerCase()}. Please contact administration.`);
    }

    if (user.school.status !== 'ACTIVE') {
      throw new ForbiddenException('The school organization account is suspended or inactive.');
    }

    // 2. Validate Password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 3. Extract Roles & Permissions
    const permissions = new Set<string>();
    const roles: string[] = [];

    for (const ur of user.userRoles) {
      roles.push(ur.role.name);
      for (const rp of ur.role.rolePermissions) {
        permissions.add(rp.permission.code);
      }
    }

    const permissionsArray = Array.from(permissions);

    // 4. Generate Access & Refresh Tokens
    const payload = {
      sub: user.id,
      email: user.email,
      schoolId: user.schoolId,
      userType: user.userType,
      roles,
      permissions: permissionsArray
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: (this.configService.get<string>('jwt.accessExpiration') || '15m') as any
    });

    // Generate Cryptographically Secure Refresh Token
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const familyId = crypto.randomUUID();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId,
        expiresAt
      }
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Write audit log
    await this.prisma.auditLog.create({
      data: {
        schoolId: user.schoolId,
        userId: user.id,
        entityName: 'User',
        entityId: user.id,
        action: 'LOGIN',
        ipAddress,
        userAgent
      }
    });

    // Fetch accessible school branches
    let availableSchools = [user.school];
    if (user.userType === 'SUPER_ADMIN' || roles.includes('SUPER_ADMIN')) {
      availableSchools = await this.prisma.school.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { code: 'asc' }
      });
    }

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900, // 15 mins in seconds
      user: {
        id: user.id,
        schoolId: user.schoolId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        status: user.status,
        roles,
        permissions: permissionsArray
      },
      school: {
        id: user.school.id,
        code: user.school.code,
        name: user.school.name,
        logoUrl: user.school.logoUrl,
        currency: user.school.currency,
        timezone: user.school.timezone
      },
      availableSchools: availableSchools.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        logoUrl: s.logoUrl,
        currency: s.currency,
        timezone: s.timezone
      }))
    };
  }

  async refreshTokens(rawRefreshToken: string) {
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const existingToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            school: true,
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!existingToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Token reuse detection: if token is already revoked, revoke entire family!
    if (existingToken.isRevoked) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: existingToken.familyId },
        data: { isRevoked: true }
      });
      throw new ForbiddenException('Compromised session detected. All sessions revoked.');
    }

    if (new Date() > existingToken.expiresAt) {
      throw new UnauthorizedException('Refresh token has expired. Please log in again.');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { isRevoked: true }
    });

    const user = existingToken.user;
    const permissions = new Set<string>();
    const roles: string[] = [];

    for (const ur of user.userRoles) {
      roles.push(ur.role.name);
      for (const rp of ur.role.rolePermissions) {
        permissions.add(rp.permission.code);
      }
    }

    const payload = {
      sub: user.id,
      email: user.email,
      schoolId: user.schoolId,
      userType: user.userType,
      roles,
      permissions: Array.from(permissions)
    };

    const newAccessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: (this.configService.get<string>('jwt.accessExpiration') || '15m') as any
    });

    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newTokenHash = crypto.createHash('sha256').update(newRawRefreshToken).digest('hex');

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newTokenHash,
        familyId: existingToken.familyId,
        expiresAt: newExpiresAt
      }
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      expiresIn: 900
    };
  }

  async logout(userId: string) {
    // Revoke all refresh tokens for this user
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true }
    });
    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
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
      school: user.school
    };
  }
}
