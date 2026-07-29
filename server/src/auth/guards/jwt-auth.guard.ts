import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth.service';
import { ensureMvpUser, getMvpUserId } from '../mvp-auth';
import type { AuthenticatedUser } from '../dto/authenticated-user.dto';
import { InterviewAIException } from '../../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../../common/exceptions/error-code.enum';

interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authEnabled =
      this.configService.get<string>('AUTH_ENABLED') === 'true';

    if (!authEnabled) {
      return this.activateMvpUser(context);
    }

    return this.activateRealJwt(context);
  }

  /**
   * @deprecated Dev-only bypass. Remove when AUTH_ENABLED=true in production.
   */
  private async activateMvpUser(context: ExecutionContext): Promise<boolean> {
    const userId = getMvpUserId(this.configService);
    await ensureMvpUser(this.prisma, userId);

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    req.user = {
      id: userId,
      email: `mvp-${userId}@interviewcoach.local`,
      role: 'user' as const,
      emailVerified: true,
    };
    return true;
  }

  private async activateRealJwt(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = (req as unknown as { headers?: { authorization?: string } })
      .headers?.authorization;
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) throw new UnauthorizedException('Bearer token is required');

    const claims = await this.authService.validateAccessToken(token);
    const dbUser = await this.authService.ensureUser(claims.id, claims.email);
    if (dbUser.status !== 'active') {
      throw new InterviewAIException(
        ErrorCode.ACCOUNT_INACTIVE,
        401,
        'This account is no longer active',
      );
    }
    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      emailVerified: claims.emailVerified,
    };

    return true;
  }
}
