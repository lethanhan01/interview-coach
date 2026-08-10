import {
  Controller,
  Get,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { AssessmentModule } from './assessment/assessment.module';
import { QuestionModule } from './question/question.module';
import { SessionModule } from './session/session.module';
import { TurnModule } from './turn/turn.module';
import { InterviewModule } from './interview/interview.module';
import { ReportModule } from './report/report.module';
import { UserModule } from './user/user.module';
import { SavedJobDescriptionModule } from './saved-job-description/saved-job-description.module';
import { validateEnv } from './config/env.validation';
import { InterviewAIExceptionFilter } from './common/exceptions/interview-ai-exception.filter';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';
import { MaintenanceModeGuard } from './common/guards/maintenance-mode.guard';

@Controller()
class ApiRootController {
  @Get()
  getRoot(): string {
    return 'Hello World!';
  }
}

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
    AssessmentModule,
    QuestionModule,
    SessionModule,
    TurnModule,
    InterviewModule,
    ReportModule,
    UserModule,
    SavedJobDescriptionModule,
    AdminModule,
  ],
  controllers: [ApiRootController],
  providers: [
    { provide: APP_FILTER, useClass: InterviewAIExceptionFilter },
    { provide: APP_GUARD, useClass: MaintenanceModeGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
