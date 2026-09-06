import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '../exceptions/error-code.enum';
import { InterviewAIException } from '../exceptions/interview-ai.exception';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  AUTH_TOKEN_VERIFIER,
  type AuthTokenVerifier,
  type AuthenticatedUserPayload,
} from './auth-token-verifier.interface';

interface AuthenticatedRequest {
  cookies?: Record<string, string | undefined>;
  headers?: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUserPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_TOKEN_VERIFIER)
    private readonly tokenVerifier: AuthTokenVerifier,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookieName = this.tokenVerifier.getAccessCookieName();
    let token = request.cookies?.[cookieName];

    if (!token && request.headers) {
      const authHeader = request.headers['authorization'] || request.headers['Authorization'];
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    if (!token) {
      throw new InterviewAIException(
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        'Authentication cookie is required',
      );
    }

    const user = await this.tokenVerifier.verifySessionToken(token);
    request.user = user;
    return true;
  }
}
