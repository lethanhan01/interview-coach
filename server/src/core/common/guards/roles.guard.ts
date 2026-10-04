import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ErrorCode } from '../exceptions/error-code.enum';
import { InterviewAIException } from '../exceptions/interview-ai.exception';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUserPayload } from './auth-token-verifier.interface';

interface AuthenticatedRequest {
  user?: AuthenticatedUserPayload;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No role restriction defined — allow all authenticated users
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user;

    if (!user) {
      throw new InterviewAIException(
        ErrorCode.FORBIDDEN,
        HttpStatus.FORBIDDEN,
        'Authentication required',
      );
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new InterviewAIException(
        ErrorCode.FORBIDDEN,
        HttpStatus.FORBIDDEN,
        `Access restricted to roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
