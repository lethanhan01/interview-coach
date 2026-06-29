import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshGuard } from './guards/refresh.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RefreshGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
