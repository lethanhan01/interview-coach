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

// --- TẦNG 1: CORE & SHARED ---
import { CommonModule } from '@core/common/common.module';
import { validateEnv } from '@core/config/env.validation';
import { InterviewAIExceptionFilter } from '@core/common/exceptions/interview-ai-exception.filter';
import { MaintenanceModeGuard } from '@core/common/guards/maintenance-mode.guard';
import { RequestIdMiddleware } from '@core/common/middleware/request-id.middleware';

// --- TẦNG 2: INFRASTRUCTURE ---
import { PrismaModule } from '@infra/database/prisma/prisma.module';
import { AiModule } from '@infra/ai/ai.module';
import { WorkflowModule } from '@infra/workflow/workflow.module';

// --- TẦNG 3: BUSINESS MODULES (BOUNDED CONTEXTS) ---
import { HealthModule } from '@modules/health/health.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { AdminModule } from '@modules/admin/admin.module';
import { MediaModule } from '@modules/media/media.module';
import { InterviewPrepModule } from '@modules/interview-prep/interview-prep.module';
import { InterviewLiveModule } from '@modules/interview-live/interview-live.module';
import { InterviewAssessmentModule } from '@modules/interview-assessment/interview-assessment.module';

@Controller()
class ApiRootController {
  @Get()
  getRoot(): string {
    return 'Hello World!';
  }
}

@Module({
  imports: [
    // Global Config & Queue Providers
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

    // Core & Infrastructure
    CommonModule,
    PrismaModule,
    AiModule,
    WorkflowModule,

    // Domain & Business Modules
    HealthModule,
    AuthModule,
    UserModule,
    AdminModule,
    MediaModule,
    InterviewPrepModule,
    InterviewLiveModule,
    InterviewAssessmentModule,
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
