import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@infra/database/prisma/prisma.module';
import { AUTH_TOKEN_VERIFIER } from '@core/common/guards/auth-token-verifier.interface';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('AUTH_JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: AUTH_TOKEN_VERIFIER,
      useExisting: AuthService,
    },
  ],
  exports: [AuthService, AUTH_TOKEN_VERIFIER],
})
export class AuthModule {}
