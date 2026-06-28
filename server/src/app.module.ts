import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { SessionModule } from './session/session.module';
import { TurnModule } from './turn/turn.module';
import { ReportModule } from './report/report.module';
import { UserModule } from './user/user.module';
import { SavedJobDescriptionModule } from './saved-job-description/saved-job-description.module';
import { validateEnv } from './config/env.validation';
import { InterviewAIExceptionFilter } from './common/exceptions/interview-ai-exception.filter';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    HealthModule,
    PrismaModule,
    AuthModule,
    AiModule,
    SessionModule,
    TurnModule,
    ReportModule,
    UserModule,
    SavedJobDescriptionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: InterviewAIExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
