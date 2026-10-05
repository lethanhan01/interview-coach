import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  ValidationPipe,
  INestApplication,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { IsEmail, MinLength, IsOptional, IsInt, Min } from 'class-validator';
import { Prisma } from '@prisma/client';
import { InterviewAIException } from './interview-ai.exception';
import { ErrorCode } from './error-code.enum';
import { InterviewAIExceptionFilter } from './interview-ai-exception.filter';
import { validationErrorFactory } from '../pipes/validation-error.factory';
import { RequestIdMiddleware } from '../middleware/request-id.middleware';

// ---------------------------------------------------------------------------
// Mock DTO & Controller cho 5 nhóm kịch bản kiểm thử
// ---------------------------------------------------------------------------

class TestBoundaryDto {
  @IsEmail({}, { message: 'email must be an email' })
  email!: string;

  @MinLength(8, { message: 'password must be longer than or equal to 8 characters' })
  password!: string;

  @IsOptional()
  @IsInt({ message: 'age must be an integer number' })
  @Min(18, { message: 'age must not be less than 18' })
  age?: number;
}

@Controller('test-boundary')
class TestBoundaryController {
  // 1. Endpoint test Validation
  @Post('validation')
  testValidation(@Body() dto: TestBoundaryDto) {
    return { success: true, data: dto };
  }

  // 2. Endpoint test Domain Conflict
  @Get('conflict')
  testConflict() {
    throw new InterviewAIException(
      ErrorCode.CONFLICT,
      HttpStatus.CONFLICT,
      'Email already registered in system',
      { details: { email: ['Email is duplicate'] } },
    );
  }

  // 3a. Endpoint test Prisma P2002 (Unique constraint)
  @Get('prisma-p2002')
  testPrismaP2002() {
    throw new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '7.8.0',
      meta: { target: ['email'] },
    });
  }

  // 3b. Endpoint test Prisma P2025 (Record not found)
  @Get('prisma-p2025')
  testPrismaP2025() {
    throw new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '7.8.0',
    });
  }

  // 3c. Endpoint test Prisma P1001 (Connection error)
  @Get('prisma-p1001')
  testPrismaP1001() {
    throw new Prisma.PrismaClientKnownRequestError('Cannot connect to database', {
      code: 'P1001',
      clientVersion: '7.8.0',
    });
  }

  // 4. Endpoint test Unhandled 500 Exception
  @Get('unhandled-500')
  testUnhandled() {
    throw new Error('Unexpected null pointer exception in service logic');
  }

  // 5. Endpoint test Anti-Leak (Sensitive credentials leak)
  @Get('anti-leak')
  testAntiLeak() {
    throw new Error(
      'CRITICAL: DB connection failed to postgres://admin:SuperSecretP@ssword123!@production-db.internal:5432/interviewcoach_prod',
    );
  }
}

@Module({
  controllers: [TestBoundaryController],
})
class TestBoundaryModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

// ---------------------------------------------------------------------------
// TEST SUITE: Error Boundary & Security Anti-Leak Tests (Phase 18)
// ---------------------------------------------------------------------------

describe('Error Boundary & Security Anti-Leak Tests (Phase 18)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [TestBoundaryModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: validationErrorFactory,
      }),
    );
    app.useGlobalFilters(new InterviewAIExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // -------------------------------------------------------------------------
  // Nhóm 1: DTO Validation Error & validationErrorFactory (HTTP 400)
  // -------------------------------------------------------------------------
  describe('Group 1: DTO Schema Validation & validationErrorFactory (HTTP 400)', () => {
    it('chấp nhận payload hợp lệ và trả về 201 Created', async () => {
      const payload = {
        email: 'candidate@example.com',
        password: 'valid-password-123',
        age: 25,
      };

      const res = await request(app.getHttpServer())
        .post('/test-boundary/validation')
        .send(payload)
        .expect(201);

      expect(res.body).toEqual({
        success: true,
        data: payload,
      });
    });

    it('gom nhóm lỗi validation thành dictionary theo property khi thiếu fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/test-boundary/validation')
        .send({})
        .expect(400);

      expect(res.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed for incoming payload',
          details: {
            email: expect.arrayContaining([expect.stringContaining('email')]),
            password: expect.arrayContaining([expect.stringContaining('password')]),
          },
        },
        meta: {
          path: '/test-boundary/validation',
          timestamp: expect.any(String),
        },
      });
    });

    it('bắt lỗi khi sai định dạng email và age < 18', async () => {
      const res = await request(app.getHttpServer())
        .post('/test-boundary/validation')
        .send({
          email: 'not-an-email',
          password: 'valid-password',
          age: 15,
        })
        .expect(400);

      expect(res.body.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(res.body.error.details).toHaveProperty('email');
      expect(res.body.error.details).toHaveProperty('age');
      expect(res.body.error.details.email).toContain('email must be an email');
      expect(res.body.error.details.age).toContain('age must not be less than 18');
    });
  });

  // -------------------------------------------------------------------------
  // Nhóm 2: Domain Conflict & Operational Exceptions (HTTP 409)
  // -------------------------------------------------------------------------
  describe('Group 2: Domain Conflict & Operational Exceptions (HTTP 409)', () => {
    it('trả về mã 409 CONFLICT và thông điệp nghiệp vụ cùng details', async () => {
      const res = await request(app.getHttpServer())
        .get('/test-boundary/conflict')
        .expect(409);

      expect(res.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.CONFLICT,
          message: 'Email already registered in system',
          details: {
            email: ['Email is duplicate'],
          },
        },
        meta: {
          path: '/test-boundary/conflict',
          timestamp: expect.any(String),
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // Nhóm 3: Prisma Infrastructure Error Mappings (P2002, P2025, P1001)
  // -------------------------------------------------------------------------
  describe('Group 3: Prisma Infrastructure Error Mappings (Safety Net)', () => {
    it('chuyển đổi P2002 (Unique constraint) thành HTTP 409 CONFLICT', async () => {
      const res = await request(app.getHttpServer())
        .get('/test-boundary/prisma-p2002')
        .expect(409);

      expect(res.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.CONFLICT,
          message: expect.stringContaining('email'),
        },
        meta: {
          path: '/test-boundary/prisma-p2002',
          timestamp: expect.any(String),
        },
      });
    });

    it('chuyển đổi P2025 (Record not found) thành HTTP 404 NOT_FOUND', async () => {
      const res = await request(app.getHttpServer())
        .get('/test-boundary/prisma-p2025')
        .expect(404);

      expect(res.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.NOT_FOUND,
          message: 'Requested record was not found or has been deleted',
        },
        meta: {
          path: '/test-boundary/prisma-p2025',
          timestamp: expect.any(String),
        },
      });
    });

    it('chuyển đổi P1001 (Connection unreachable) thành HTTP 503 SERVICE_UNAVAILABLE', async () => {
      const res = await request(app.getHttpServer())
        .get('/test-boundary/prisma-p1001')
        .expect(503);

      expect(res.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.SERVICE_UNAVAILABLE,
          message: 'Database server is temporarily unreachable',
        },
        meta: {
          path: '/test-boundary/prisma-p1001',
          timestamp: expect.any(String),
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // Nhóm 4: Unexpected Internal Errors (HTTP 500)
  // -------------------------------------------------------------------------
  describe('Group 4: Unexpected Internal Errors Sanitization (HTTP 500)', () => {
    it('bắt unhandled error và trả về 500 INTERNAL_ERROR', async () => {
      const res = await request(app.getHttpServer())
        .get('/test-boundary/unhandled-500')
        .expect(500);

      expect(res.body).toMatchObject({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
        },
        meta: {
          path: '/test-boundary/unhandled-500',
          timestamp: expect.any(String),
        },
      });
    });
  });

  // -------------------------------------------------------------------------
  // Nhóm 5: Security & Anti-Leak Protection
  // -------------------------------------------------------------------------
  describe('Group 5: Security & Anti-Leak Protection', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('trên môi trường PRODUCTION: làm sạch tuyệt đối credentials và stack trace', async () => {
      process.env.NODE_ENV = 'production';

      const res = await request(app.getHttpServer())
        .get('/test-boundary/anti-leak')
        .set('x-correlation-id', 'sec-audit-trace-888')
        .expect(500);

      // 1. Kiểm tra envelope cấu trúc chuẩn
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(res.body.error.message).toBe('Internal server error');
      expect(res.body.error.details).toBeNull();

      // 2. KHẲNG ĐỊNH BẢO MẬT: Tuyệt đối không leak mật khẩu, URL, hostname
      const rawBody = JSON.stringify(res.body);
      expect(rawBody).not.toContain('SuperSecretP@ssword123!');
      expect(rawBody).not.toContain('postgres://');
      expect(rawBody).not.toContain('production-db.internal');
      expect(rawBody).not.toContain('interviewcoach_prod');

      // 3. BẢO TOÀN TRUY VẾT: Header và meta correlationId vẫn được bảo toàn
      expect(res.body.meta.correlationId).toBe('sec-audit-trace-888');
      expect(res.headers['x-correlation-id']).toBe('sec-audit-trace-888');
      expect(res.body.meta.requestId).toBeDefined();
    });

    it('trên môi trường STAGING hoặc undefined: áp dụng Whitelist an toàn, không rò rỉ stack trace', async () => {
      process.env.NODE_ENV = 'staging';

      const res = await request(app.getHttpServer())
        .get('/test-boundary/anti-leak')
        .expect(500);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(res.body.error.message).toBe('Internal server error');
      expect(res.body.error.details).toBeNull();
      const rawBody = JSON.stringify(res.body);
      expect(rawBody).not.toContain('SuperSecretP@ssword123!');
      expect(rawBody).not.toContain('postgres://');
    });
  });
});

