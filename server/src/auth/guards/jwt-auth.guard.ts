import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (this.configService.get<string>('AUTH_ENABLED') === 'false') {
      const req = context.switchToHttp().getRequest();
      req.user = {
        id: this.configService.getOrThrow<string>('MOCK_USER_ID'),
        email: 'dev@example.com',
      };
      return true;
    }
    return super.canActivate(context);
  }
}
