import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import jwt from 'jsonwebtoken';

@Injectable()
export class SseTokenGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: { id: string } }>();

    if (this.configService.get<string>('AUTH_ENABLED') === 'false') {
      req.user = {
        id: this.configService.getOrThrow<string>('MOCK_USER_ID'),
      };
      return true;
    }

    const token = req.query['token'] as string | undefined;
    if (!token) return false;
    try {
      const secret = this.configService.getOrThrow<string>(
        'SUPABASE_JWT_SECRET',
      );
      const payload = jwt.verify(token, secret) as { sub: string };
      req.user = { id: payload.sub };
      return true;
    } catch {
      return false;
    }
  }
}
