import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedAdmin {
  id: string;
  email: string;
}

export const CurrentAdmin = createParamDecorator(
  (data: keyof AuthenticatedAdmin | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const admin: AuthenticatedAdmin = request.user;
    return data ? admin?.[data] : admin;
  },
);
