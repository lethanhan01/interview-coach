import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { AuthService } from '../auth.service';
import type { AuthenticatedUser } from '../dto/authenticated-user.dto';

interface AuthenticatedRequest {
  cookies?: Record<string, string | undefined>;
  user?: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[this.authService.getCookieName()];
    if (!token) {
      throw new InterviewAIException(
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        'Authentication cookie is required',
      );
    }
    const user = await this.authService.getAuthenticatedUser(token);
    request.user = { id: user.id, email: user.email, role: user.role };
    return true;
  }
}
