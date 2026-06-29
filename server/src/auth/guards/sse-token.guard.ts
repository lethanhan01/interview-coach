import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { ensureMvpUser, getMvpUserId } from '../mvp-auth';

@Injectable()
export class SseTokenGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: { id: string } }>();

    return this.activateMvpUser(req);
  }

  private async activateMvpUser(
    req: Request & { user?: { id: string } },
  ): Promise<boolean> {
    const userId = getMvpUserId(this.configService);
    await ensureMvpUser(this.prisma, userId);
    req.user = { id: userId };
    return true;
  }
}
