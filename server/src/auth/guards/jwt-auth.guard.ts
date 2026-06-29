import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ensureMvpUser, getMvpUserId } from '../mvp-auth';

interface AuthenticatedRequest {
  user?: {
    id: string;
    email: string;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return this.activateMvpUser(context);
  }

  private async activateMvpUser(context: ExecutionContext): Promise<boolean> {
    const userId = getMvpUserId(this.configService);
    await ensureMvpUser(this.prisma, userId);

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    req.user = {
      id: userId,
      email: `mvp-${userId}@interviewcoach.local`,
    };
    return true;
  }
}
