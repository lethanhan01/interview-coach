import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { InterviewAIException } from '../../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../../common/exceptions/error-code.enum';

@Injectable()
export class RefreshGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.['refresh_token'] as string | undefined;
    if (!token) {
      throw new InterviewAIException(
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        'Missing refresh token',
      );
    }
    req.user = { refreshToken: token };
    return true;
  }
}
