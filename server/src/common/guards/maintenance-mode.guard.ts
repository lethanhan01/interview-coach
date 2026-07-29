import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '../exceptions/error-code.enum';
import { InterviewAIException } from '../exceptions/interview-ai.exception';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Blocks every API mutation while an incident is being investigated. */
@Injectable()
export class MaintenanceModeGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.config.get<string>('MAINTENANCE_MODE') !== 'true') return true;

    const request = context.switchToHttp().getRequest<{ method?: string }>();
    if (SAFE_METHODS.has(request.method?.toUpperCase() ?? '')) return true;

    throw new InterviewAIException(
      ErrorCode.MAINTENANCE_MODE,
      HttpStatus.SERVICE_UNAVAILABLE,
      'Writes are temporarily disabled while maintenance is in progress.',
    );
  }
}
