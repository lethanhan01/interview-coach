import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class SseTokenGuard implements CanActivate {
  constructor(private readonly jwtAuthGuard: JwtAuthGuard) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return this.jwtAuthGuard.canActivate(context);
  }
}
