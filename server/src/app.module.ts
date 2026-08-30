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
import { AiModule } from '@infra/ai/ai.module';
import { AssessmentModule } from './assessment/assessment.module';
import { QuestionModule } from './question/question.module';
import { SessionModule } from './session/session.module';
import { TurnModule } from './turn/turn.module';
import { MediaModule } from '@modules/media/media.module';
import { ReportModule } from './report/report.module';
import { UserModule } from './user/user.module';
import { SavedJobDescriptionModule } from './saved-job-description/saved-job-description.module';
import { validateEnv } from '@core/config/env.validation';
import { InterviewAIExceptionFilter } from '@core/common/exceptions/interview-ai-exception.filter';
import { RequestIdMiddleware } from '@core/common/middleware/request-id.middleware';
import { CommonModule } from '@core/common/common.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';
import { MaintenanceModeGuard } from '@core/common/guards/maintenance-mode.guard';

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
    MediaModule,
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
