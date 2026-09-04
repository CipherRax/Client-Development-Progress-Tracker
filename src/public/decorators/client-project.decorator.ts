import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Project } from '@prisma/client';

export const ClientProject = createParamDecorator((_data: unknown, ctx: ExecutionContext): Project => {
  const request = ctx.switchToHttp().getRequest();
  return request.clientProject;
});
