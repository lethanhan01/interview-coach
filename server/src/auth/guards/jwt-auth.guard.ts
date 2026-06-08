import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    if (process.env.AUTH_ENABLED === 'false') {
      const req = context.switchToHttp().getRequest();
      req.user = {
        id: process.env.MOCK_USER_ID ?? 'dev-user-1',
        email: 'dev@example.com',
      };
      return true;
    }
    return super.canActivate(context);
  }
}
