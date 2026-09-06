import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentSchool = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.activeSchoolId || request.headers['x-school-id'] || request.user?.schoolId;
  }
);
