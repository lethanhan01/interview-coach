import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUserPayload } from '../guards/auth-token-verifier.interface';

export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthenticatedUserPayload | undefined,
    ctx: ExecutionContext,
  ):
    | AuthenticatedUserPayload
    | AuthenticatedUserPayload[keyof AuthenticatedUserPayload]
    | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUserPayload }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
