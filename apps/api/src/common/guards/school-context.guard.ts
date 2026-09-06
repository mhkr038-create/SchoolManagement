import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SchoolContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Wait for JwtAuthGuard to handle authentication
    }

    // Super Admin can switch tenants via header if needed
    if (user.userType === 'SUPER_ADMIN') {
      const headerSchoolId = request.headers['x-school-id'];
      if (headerSchoolId) {
        request.activeSchoolId = headerSchoolId;
      } else {
        request.activeSchoolId = user.schoolId;
      }
      return true;
    }

    // Regular users are strictly pinned to their registered school
    const headerSchoolId = request.headers['x-school-id'];
    if (headerSchoolId && headerSchoolId !== user.schoolId) {
      throw new ForbiddenException('Cross-tenant data access is strictly prohibited');
    }

    request.activeSchoolId = user.schoolId;
    return true;
  }
}
