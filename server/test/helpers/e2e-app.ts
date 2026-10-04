import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/database/prisma/prisma.service';
import {
  QUESTION_GEN_QUEUE,
  FEEDBACK_QUEUE,
  REPORT_QUEUE,
  TRANSCRIPTION_QUEUE,
} from '../../src/core/common/constants/queue.constants';

export interface E2eTestContext {
  app: INestApplication;
  prisma: PrismaService;
  cleanup: () => Promise<void>;
}

export async function createE2eTestApp(): Promise<E2eTestContext> {
  const mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
    getJobs: jest.fn().mockResolvedValue([]),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(getQueueToken(QUESTION_GEN_QUEUE))
    .useValue(mockQueue)
    .overrideProvider(getQueueToken(FEEDBACK_QUEUE))
    .useValue(mockQueue)
    .overrideProvider(getQueueToken(REPORT_QUEUE))
    .useValue(mockQueue)
    .overrideProvider(getQueueToken(TRANSCRIPTION_QUEUE))
    .useValue(mockQueue)
    .compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(cookieParser());
  await app.init();

  const prisma = app.get(PrismaService);

  return {
    app,
    prisma,
    cleanup: async () => {
      await app.close();
    },
  };
}
