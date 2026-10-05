import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  Controller,
  Post,
  Body,
  INestApplication,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { RequestContext } from '@core/common/context/request-context';
import { AppLogger } from '@core/common/services/app-logger.service';
import { RequestIdMiddleware } from '@core/common/middleware/request-id.middleware';
import { BullMqJobErrorHandler } from './bullmq-error-handler';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';

// ---------------------------------------------------------------------------
// Mock Controller mô phỏng luồng tiếp nhận HTTP và Dispatch Job
// ---------------------------------------------------------------------------

@Controller('trace-test')
class TraceTestController {
  constructor(private readonly logger: AppLogger) {}

  @Post('dispatch')
  dispatchJob(@Body() body: { action: string; sensitiveToken?: string }) {
    const correlationId = RequestContext.getCorrelationId();
    const requestId = RequestContext.getRequestId();

    this.logger.log('HTTP: Received request to dispatch job', 'TraceController', {
      action: body.action,
      token: body.sensitiveToken,
    });

    return {
      success: true,
      correlationId,
      requestId,
      dispatchedJob: {
        id: 'job-report-101',
        name: 'generate-report',
        data: {
          action: body.action,
          correlationId,
        },
      },
    };
  }
}

@Module({
  controllers: [TraceTestController],
  providers: [AppLogger],
})
class TraceTestModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

// ---------------------------------------------------------------------------
// Test Suite: Observability Trace Continuity & PII Masking (Phase 19)
// ---------------------------------------------------------------------------

describe('Observability Trace Continuity & Distributed Tracing (Phase 19)', () => {
  let app: INestApplication;
  const originalEnv = process.env.NODE_ENV;
  const capturedLogs: string[] = [];
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeAll(async () => {
    process.env.NODE_ENV = 'production';

    logSpy = jest.spyOn(console, 'log').mockImplementation((...args) => {
      capturedLogs.push(args.join(' '));
    });
    errorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      capturedLogs.push(args.join(' '));
    });

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [TraceTestModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    process.env.NODE_ENV = originalEnv;
    logSpy.mockRestore();
    errorSpy.mockRestore();
    await app.close();
  });

  beforeEach(() => {
    capturedLogs.length = 0;
  });

  it('bảo toàn correlationId từ HTTP Header -> RequestContext -> BullMQ Job -> Worker Processor', async () => {
    const clientTraceId = 'trace-distributed-uuid-9999';

    // -----------------------------------------------------------------------
    // Bước 1: Client gửi HTTP Request mang header x-correlation-id
    // -----------------------------------------------------------------------
    const httpResponse = await request(app.getHttpServer())
      .post('/trace-test/dispatch')
      .set('x-correlation-id', clientTraceId)
      .send({
        action: 'generate_report',
        sensitiveToken: 'super-secret-jwt-token-xyz',
      })
      .expect(201);

    // Kiểm tra header phản hồi HTTP
    expect(httpResponse.headers['x-correlation-id']).toBe(clientTraceId);
    expect(httpResponse.body.correlationId).toBe(clientTraceId);

    // -----------------------------------------------------------------------
    // Bước 2: Kiểm tra Log phía HTTP được ghi nhận đúng correlationId
    // -----------------------------------------------------------------------
    const parsedLogs = capturedLogs
      .map((str) => {
        try {
          return JSON.parse(str);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const httpLog = parsedLogs.find((l) => l.message === 'HTTP: Received request to dispatch job');
    expect(httpLog).toBeDefined();
    expect(httpLog.correlationId).toBe(clientTraceId);
    expect(httpLog.level).toBe('info');
    expect(httpLog.context).toBe('TraceController');

    // Kiểm tra PII Masking: token phải bị chuyển thành [REDACTED]
    expect(httpLog.meta?.token).toBe('[REDACTED]');
    expect(JSON.stringify(httpLog)).not.toContain('super-secret-jwt-token-xyz');

    // -----------------------------------------------------------------------
    // Bước 3: Worker đón nhận Job mang correlationId từ HTTP
    // -----------------------------------------------------------------------
    const jobPayload = httpResponse.body.dispatchedJob;
    const mockWorkerJob = {
      id: jobPayload.id,
      name: jobPayload.name,
      data: jobPayload.data,
      attemptsMade: 0,
      opts: { attempts: 3 },
    };

    let workerCapturedCorrelationId = '';
    const workerResult = await BullMqJobErrorHandler.handleJobExecution(
      'ReportTraceProcessor',
      mockWorkerJob as any,
      async () => {
        // Trong worker, RequestContext phải được khôi phục chính xác
        workerCapturedCorrelationId = RequestContext.getCorrelationId();

        const logger = app.get(AppLogger);
        logger.log('Worker: Processing assessment report', 'ReportTraceProcessor', {
          sessionId: 'sess-123',
          apiKey: 'secret-openai-api-key-999',
        });

        return { reportGenerated: true };
      },
    );

    // -----------------------------------------------------------------------
    // Bước 4: Khẳng định tính liên tục của Trace trên Worker
    // -----------------------------------------------------------------------
    expect(workerResult).toEqual({ reportGenerated: true });
    expect(workerCapturedCorrelationId).toBe(clientTraceId);

    const updatedParsedLogs = capturedLogs
      .map((str) => {
        try {
          return JSON.parse(str);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const workerLog = updatedParsedLogs.find(
      (l) => l.message === 'Worker: Processing assessment report',
    );
    expect(workerLog).toBeDefined();
    expect(workerLog.correlationId).toBe(clientTraceId);
    expect(workerLog.context).toBe('ReportTraceProcessor');

    // Khẳng định PII Masking trong Worker Log
    expect(workerLog.meta?.apiKey).toBe('[REDACTED]');
    expect(JSON.stringify(workerLog)).not.toContain('secret-openai-api-key-999');
  });

  it('tự động sinh correlationId khi Client không gửi header và bảo toàn sang Worker', async () => {
    // Client gửi request không có x-correlation-id
    const httpResponse = await request(app.getHttpServer())
      .post('/trace-test/dispatch')
      .send({ action: 'generate_questions' })
      .expect(201);

    const generatedTraceId = httpResponse.headers['x-correlation-id'];
    expect(generatedTraceId).toBeDefined();
    expect(generatedTraceId).not.toBe('no-correlation-id');
    expect(httpResponse.body.correlationId).toBe(generatedTraceId);

    // Worker đón nhận job với correlationId sinh tự động
    const mockWorkerJob = {
      id: 'job-qg-202',
      name: 'generate-questions',
      data: { correlationId: generatedTraceId },
      attemptsMade: 0,
      opts: { attempts: 3 },
    };

    let workerCorrelationId = '';
    await BullMqJobErrorHandler.handleJobExecution(
      'QuestionGenProcessor',
      mockWorkerJob as any,
      async () => {
        workerCorrelationId = RequestContext.getCorrelationId();
      },
    );

    expect(workerCorrelationId).toBe(generatedTraceId);
  });

  it('ghi log lỗi worker có đầy đủ correlationId khi xảy ra sự cố', async () => {
    const errorTraceId = 'trace-worker-failure-uuid-777';
    const mockFailedJob = {
      id: 'job-fail-303',
      name: 'failed-task',
      data: { correlationId: errorTraceId },
      attemptsMade: 2, // Lần thử thứ 3 (hết lượt)
      opts: { attempts: 3 },
    };

    const errorHandlerSpy = jest.spyOn((BullMqJobErrorHandler as any).logger, 'error');
    let correlationInContext = '';

    try {
      await BullMqJobErrorHandler.handleJobExecution(
        'FailedTaskProcessor',
        mockFailedJob as any,
        async () => {
          correlationInContext = RequestContext.getCorrelationId();
          throw new InterviewAIException(
            ErrorCode.AI_TIMEOUT,
            504,
            'AI gateway execution timed out after 30s',
          );
        },
      );
    } catch {
      // Expected to throw
    }

    expect(correlationInContext).toBe(errorTraceId);
    expect(errorHandlerSpy).toHaveBeenCalledWith(
      expect.stringContaining('[FailedTaskProcessor] Job job-fail-303 FAILED permanently'),
      expect.anything(),
    );
    errorHandlerSpy.mockRestore();
  });
});
