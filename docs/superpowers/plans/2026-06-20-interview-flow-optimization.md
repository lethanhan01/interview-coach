# Interview Flow Optimization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sửa 7 vấn đề trong luồng interview: validation, session state guard, follow-up reliability, event-driven report, report quality signal, async voice transcription, và dead code cleanup.

**Architecture:** Nhóm A (Tasks 1-3) là quick wins độc lập, không migration. Nhóm B (Tasks 4-5) refactor luồng report thành event-driven bằng cách thêm `enqueueIfAllFeedbacksReady` vào `ReportService` và wire từ `FeedbackProcessor`. Nhóm C (Task 6) async hóa voice transcription bằng BullMQ queue mới + Prisma migration. Nhóm D (Task 7) xóa dead code.

**Tech Stack:** NestJS 11, BullMQ, Prisma, class-validator, Jest 30

## Global Constraints

- Không thay đổi public API shape của bất kỳ endpoint nào (trừ Task 5 thêm field mới vào report response và Task 6 thêm field vào `TurnResponseDto`)
- Chỉ thêm `@MinLength`, không thêm `@MaxLength` mới (đã có `@MaxLength(2048)` trên `audioFileUrl`)
- `SessionType` dùng lowercase xuyên suốt: `'hr'`, `'technical'`, `'mixed'`
- Mọi queue name phải dùng constant từ `queue.constants.ts`; không hardcode string
- Test pattern: dùng `createMock*` factories từ `src/test-utils/mock-factories.ts`; không mock module-level
- Run tests: `cd server && npm test -- --testPathPattern=<file>`
- Commit message: imperative mood, ≤72 chars subject

---

## Task 1: SubmitAnswerDto — MinLength validation cho answerText

**Files:**
- Modify: `server/src/turn/dto/submit-answer.dto.ts`
- Create: `server/src/turn/dto/submit-answer.dto.spec.ts`

**Interfaces:**
- Produces: `answerText` bắt buộc ít nhất 10 ký tự khi `answerMode = 'text'`

---

- [ ] **Step 1: Tạo spec file và viết failing tests**

```ts
// server/src/turn/dto/submit-answer.dto.spec.ts
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SubmitAnswerDto } from './submit-answer.dto';

describe('SubmitAnswerDto', () => {
  describe('text mode', () => {
    it('rejects answerText dưới 10 ký tự', async () => {
      const dto = plainToInstance(SubmitAnswerDto, {
        questionId: 'q-1',
        answerMode: 'text',
        answerText: 'short',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'answerText')).toBe(true);
    });

    it('rejects answerText rỗng', async () => {
      const dto = plainToInstance(SubmitAnswerDto, {
        questionId: 'q-1',
        answerMode: 'text',
        answerText: '',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'answerText')).toBe(true);
    });

    it('chấp nhận answerText đủ 10 ký tự', async () => {
      const dto = plainToInstance(SubmitAnswerDto, {
        questionId: 'q-1',
        answerMode: 'text',
        answerText: 'Đây là câu trả lời đủ độ dài.',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('không validate answerText khi mode là voice', async () => {
      const dto = plainToInstance(SubmitAnswerDto, {
        questionId: 'q-1',
        answerMode: 'voice',
        audioFileUrl: 'https://example.com/audio.mp3',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'answerText')).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

```
cd server && npm test -- --testPathPattern=submit-answer.dto.spec
```

Expected: FAIL — `answerText` không có MinLength nên các test reject pass thay vì fail.

- [ ] **Step 3: Thêm `@MinLength(10)` vào `answerText` trong DTO**

```ts
// server/src/turn/dto/submit-answer.dto.ts
import {
  IsEnum,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
  ValidateIf,
  IsUrl,
} from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  questionId: string;

  @IsEnum(['text', 'voice'])
  answerMode: 'text' | 'voice';

  @ValidateIf((o: SubmitAnswerDto) => o.answerMode === 'text')
  @IsString()
  @MinLength(10)
  answerText?: string;

  @ValidateIf((o: SubmitAnswerDto) => o.answerMode === 'voice')
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
    require_valid_protocol: true,
  })
  @MaxLength(2048)
  audioFileUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  audioDurationSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10 * 1024 * 1024)
  audioSizeBytes?: number;
}
```

- [ ] **Step 4: Chạy lại tests để xác nhận PASS**

```
cd server && npm test -- --testPathPattern=submit-answer.dto.spec
```

Expected: 4 tests PASS.

- [ ] **Step 5: Cập nhật CLAUDE.md turn module**

Trong `server/src/turn/CLAUDE.md`, section `SubmitAnswerDto`, đổi comment trên `answerText`:

```
answerText?: string           // bắt buộc nếu answerMode = 'text', @MinLength(10)
```

(Dòng này đã đúng trong CLAUDE.md — kiểm tra xác nhận không cần sửa)

- [ ] **Step 6: Commit**

```
git add server/src/turn/dto/submit-answer.dto.ts server/src/turn/dto/submit-answer.dto.spec.ts
git commit -m "fix: add MinLength(10) validation to answerText in SubmitAnswerDto"
```

---

## Task 2: TurnService — Chặn submission khi session ở trạng thái 'generating'

**Files:**
- Modify: `server/src/turn/turn.service.ts`
- Modify: `server/src/turn/turn.service.spec.ts`

**Interfaces:**
- Produces: `submitAnswer()` throw `SESSION_NOT_ACTIVE` khi session status là `'generating'`

---

- [ ] **Step 1: Thêm test case vào turn.service.spec.ts**

Tìm describe block `TurnService` trong file, thêm test case sau:

```ts
it('throw SESSION_NOT_ACTIVE khi session status là generating', async () => {
  mockPrisma.interviewSession.findUnique.mockResolvedValue({
    ...BASE_SESSION,
    status: 'generating',
  });

  await expect(
    service.submitAnswer('session-123', 'user-abc', TEXT_DTO),
  ).rejects.toThrow(InterviewAIException);

  mockPrisma.interviewSession.findUnique.mockResolvedValue({
    ...BASE_SESSION,
    status: 'generating',
  });
  try {
    await service.submitAnswer('session-123', 'user-abc', TEXT_DTO);
  } catch (e) {
    expect((e as InterviewAIException).errorCode).toBe(
      ErrorCode.SESSION_NOT_ACTIVE,
    );
  }
});
```

- [ ] **Step 2: Chạy test để xác nhận FAIL**

```
cd server && npm test -- --testPathPattern=turn.service.spec
```

Expected: test mới FAIL — hiện tại 'generating' được chấp nhận.

- [ ] **Step 3: Sửa điều kiện trong turn.service.ts**

`server/src/turn/turn.service.ts`, line 49, đổi từ:

```ts
if (!['active', 'ready', 'generating'].includes(session.status)) {
```

thành:

```ts
if (!['active', 'ready'].includes(session.status)) {
```

- [ ] **Step 4: Chạy lại tests để xác nhận PASS**

```
cd server && npm test -- --testPathPattern=turn.service.spec
```

Expected: tất cả tests PASS bao gồm test mới.

- [ ] **Step 5: Commit**

```
git add server/src/turn/turn.service.ts server/src/turn/turn.service.spec.ts
git commit -m "fix: reject answer submission when session is in generating state"
```

---

## Task 3: FollowUpProcessor — Thêm retry và graceful degradation

**Files:**
- Modify: `server/src/common/constants/queue.constants.ts`
- Modify: `server/src/turn/turn.service.ts`
- Modify: `server/src/ai/processors/follow-up.processor.ts`
- Modify: `server/src/ai/processors/follow-up.processor.spec.ts`

**Interfaces:**
- Consumes: `FOLLOW_UP_JOB_ATTEMPTS` từ `queue.constants.ts`
- Produces: follow-up job retry khi gặp transient error; graceful degradation sau max attempts; quota error luôn graceful

---

- [ ] **Step 1: Thêm `FOLLOW_UP_JOB_ATTEMPTS` vào queue.constants.ts**

```ts
// server/src/common/constants/queue.constants.ts
export const QUESTION_GEN_QUEUE = 'question-generation';
export const FOLLOW_UP_QUEUE = 'follow-up';
export const FEEDBACK_QUEUE = 'feedback';
export const REPORT_QUEUE = 'comprehensive-report';
export const REWRITE_EVAL_QUEUE = 'rewrite-eval';

export const FEEDBACK_JOB_ATTEMPTS = 2;
export const QUESTION_GEN_JOB_ATTEMPTS = 2;
export const FOLLOW_UP_JOB_ATTEMPTS = 2;    // thêm dòng này
export const REPORT_JOB_ATTEMPTS = 20;
export const REPORT_JOB_RETRY_DELAY_MS = 3_000;
```

- [ ] **Step 2: Cập nhật turn.service.ts để dùng constant**

`server/src/turn/turn.service.ts`, sửa 2 chỗ:

Import:
```ts
import {
  FOLLOW_UP_QUEUE,
  FEEDBACK_QUEUE,
  FEEDBACK_JOB_ATTEMPTS,
  FOLLOW_UP_JOB_ATTEMPTS,
} from '../common/constants/queue.constants';
```

Enqueue call (line 136-140), đổi `attempts: 1` thành:
```ts
await this.followUpQueue.add('follow-up', jobBase, {
  jobId: `follow-up-${answer.id}`,
  attempts: FOLLOW_UP_JOB_ATTEMPTS,
  backoff: { type: 'fixed', delay: 2000 },
});
```

- [ ] **Step 3: Thêm test case vào follow-up.processor.spec.ts**

Thêm vào describe block hiện tại:

```ts
describe('error handling', () => {
  it('re-throw lỗi transient khi chưa phải last attempt để trigger retry', async () => {
    const transientError = new Error('Connection timeout');
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue({
      generateFollowUp: jest.fn().mockRejectedValue(transientError),
    });

    const job = {
      data: BASE_JOB_DATA,
      attemptsMade: 0,        // attempt đầu tiên, còn attempt thứ 2
      opts: { attempts: 2 },
    } as unknown as Job<typeof BASE_JOB_DATA>;

    await expect(processor.process(job)).rejects.toThrow('Connection timeout');
  });

  it('không throw khi đã đạt last attempt (graceful degradation)', async () => {
    const error = new Error('AI service error');
    mockContextPack.getContextPack.mockReturnValue({} as any);
    mockFactory.getStrategy.mockReturnValue({
      generateFollowUp: jest.fn().mockRejectedValue(error),
    });

    const job = {
      data: BASE_JOB_DATA,
      attemptsMade: 1,        // last attempt (attempts=2, index 1)
      opts: { attempts: 2 },
    } as unknown as Job<typeof BASE_JOB_DATA>;

    await expect(processor.process(job)).resolves.toBeUndefined();
    expect(mockPrisma.followUpQuestion.create).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Chạy tests để xác nhận các test mới FAIL**

```
cd server && npm test -- --testPathPattern=follow-up.processor.spec
```

Expected: test "re-throw transient error" FAIL (processor hiện không throw), test "graceful degradation" PASS (vô tình).

- [ ] **Step 5: Cập nhật FollowUpProcessor**

```ts
// server/src/ai/processors/follow-up.processor.ts
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { ContextPackService } from '../context-pack.service';
import { PipelineStrategyFactory } from '../pipelines/pipeline-strategy.factory';
import {
  FOLLOW_UP_QUEUE,
  FOLLOW_UP_JOB_ATTEMPTS,
} from '../../common/constants/queue.constants';
import type { SessionType } from '../pipelines/interview-pipeline.interface';
import { isAIQuotaExceeded } from '../ai-error.utils';

interface FollowUpJobDto {
  sessionId: string;
  turnId: string;
  answerId: string;
  questionText: string;
  answerText: string;
  contextPack: 'VN' | 'Western';
  sessionType: SessionType;
}

@Processor(FOLLOW_UP_QUEUE)
export class FollowUpProcessor extends WorkerHost {
  private readonly logger = new Logger(FollowUpProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sseService: SseService,
    private readonly contextPackService: ContextPackService,
    private readonly factory: PipelineStrategyFactory,
  ) {
    super();
  }

  async process(job: Job<FollowUpJobDto>): Promise<void> {
    const {
      sessionId,
      turnId,
      answerId,
      questionText,
      answerText,
      contextPack,
      sessionType,
    } = job.data;

    try {
      const contextPackConfig =
        this.contextPackService.getContextPack(contextPack);
      const strategy = this.factory.getStrategy(sessionType);

      const result = await strategy.generateFollowUp({
        sessionType,
        questionText,
        answerText,
        contextPackConfig,
      });

      if (result === null) {
        return;
      }

      await this.prisma.followUpQuestion.create({
        data: {
          userAnswerId: answerId,
          followUpText: result.followUpText,
          triggerRule: 'ai_suggested',
          triggerReason: result.triggerReason,
        },
      });

      await this.sseService.emit(`sse:session:${sessionId}`, 'turn.follow_up', {
        turnId,
        followUpText: result.followUpText,
      });
    } catch (error: unknown) {
      if (isAIQuotaExceeded(error)) {
        this.logger.warn(
          `Follow-up skipped for session ${sessionId} turn ${turnId}: OpenAI quota exhausted`,
        );
        return;
      }

      const totalAttempts = job.opts.attempts ?? FOLLOW_UP_JOB_ATTEMPTS;
      const isLastAttempt = job.attemptsMade >= totalAttempts - 1;

      if (!isLastAttempt) {
        this.logger.warn(
          `FollowUpProcessor attempt ${job.attemptsMade + 1}/${totalAttempts} failed for turn ${turnId}, retrying`,
          error instanceof Error ? error.message : String(error),
        );
        throw error;
      }

      this.logger.warn(
        `Follow-up skipped after ${totalAttempts} attempts for session ${sessionId} turn ${turnId}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
```

- [ ] **Step 6: Chạy lại tests**

```
cd server && npm test -- --testPathPattern=follow-up.processor.spec
```

Expected: tất cả tests PASS.

- [ ] **Step 7: Commit**

```
git add server/src/common/constants/queue.constants.ts \
        server/src/turn/turn.service.ts \
        server/src/ai/processors/follow-up.processor.ts \
        server/src/ai/processors/follow-up.processor.spec.ts
git commit -m "fix: add retry and graceful degradation to follow-up job"
```

---

## Task 4: Event-driven report — Thay retry loop bằng trigger từ FeedbackProcessor

**Files:**
- Modify: `server/src/report/report.service.ts`
- Modify: `server/src/report/report.service.spec.ts`
- Modify: `server/src/ai/processors/feedback.processor.ts`
- Modify: `server/src/ai/processors/feedback.processor.spec.ts`
- Modify: `server/src/session/session.service.ts`
- Modify: `server/src/common/constants/queue.constants.ts`
- Modify: `server/src/test-utils/mock-factories.ts` (thêm `createMockReportService`)

**Interfaces:**
- Produces: `ReportService.enqueueIfAllFeedbacksReady(sessionId, sessionType, contextPack)` — enqueue report job chỉ khi tất cả feedbacks đã hoàn thành và session status là 'completing'
- Produces: `FeedbackProcessor` gọi `enqueueIfAllFeedbacksReady` sau mỗi feedback completion (cả success lẫn fallback)
- Produces: `SessionService.updateStatus('completed')` dùng `enqueueIfAllFeedbacksReady` thay vì `enqueueReport` trực tiếp

**Dependency:** Cần hoàn thành sau Task 1-3.

---

- [ ] **Step 1: Thêm `createMockReportService` vào mock-factories.ts**

Mở `server/src/test-utils/mock-factories.ts`, tìm cuối file và thêm:

```ts
export const createMockReportService = () => ({
  getReport: jest.fn(),
  enqueueReport: jest.fn().mockResolvedValue(undefined),
  enqueueIfAllFeedbacksReady: jest.fn().mockResolvedValue(undefined),
});
```

- [ ] **Step 2: Thêm test cho `enqueueIfAllFeedbacksReady` vào report.service.spec.ts**

Mở `server/src/report/report.service.spec.ts`, thêm describe block mới sau describe `enqueueReport`:

```ts
describe('enqueueIfAllFeedbacksReady', () => {
  it('không enqueue khi session status không phải completing', async () => {
    mockPrisma.interviewSession.findUnique.mockResolvedValue({
      ...COMPLETED_SESSION,
      status: 'active',
    });

    await service.enqueueIfAllFeedbacksReady('session-123', 'hr', 'VN');

    expect(mockReportQueue.add).not.toHaveBeenCalled();
  });

  it('không enqueue khi chưa đủ feedbacks', async () => {
    mockPrisma.interviewSession.findUnique.mockResolvedValue({
      ...COMPLETED_SESSION,
      status: 'completing',
    });
    mockPrisma.userAnswer.count
      .mockResolvedValueOnce(3)  // total
      .mockResolvedValueOnce(2); // done

    await service.enqueueIfAllFeedbacksReady('session-123', 'hr', 'VN');

    expect(mockReportQueue.add).not.toHaveBeenCalled();
  });

  it('enqueue report khi tất cả feedbacks đã xong và status là completing', async () => {
    mockPrisma.interviewSession.findUnique.mockResolvedValue({
      ...COMPLETED_SESSION,
      status: 'completing',
    });
    mockPrisma.userAnswer.count
      .mockResolvedValueOnce(3)  // total
      .mockResolvedValueOnce(3); // done
    mockPrisma.userAnswer.findMany.mockResolvedValue([
      { id: 'a-1' },
      { id: 'a-2' },
      { id: 'a-3' },
    ]);
    mockReportQueue.getJob.mockResolvedValue(null);
    mockReportQueue.add.mockResolvedValue({} as any);

    await service.enqueueIfAllFeedbacksReady('session-123', 'hr', 'VN');

    expect(mockReportQueue.add).toHaveBeenCalledWith(
      'comprehensive-report',
      expect.objectContaining({ sessionId: 'session-123' }),
      expect.objectContaining({ jobId: 'report-session-123' }),
    );
  });

  it('không enqueue khi session không tồn tại', async () => {
    mockPrisma.interviewSession.findUnique.mockResolvedValue(null);

    await service.enqueueIfAllFeedbacksReady('session-123', 'hr', 'VN');

    expect(mockReportQueue.add).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Chạy test để xác nhận FAIL**

```
cd server && npm test -- --testPathPattern=report.service.spec
```

Expected: 4 tests mới FAIL — method chưa tồn tại.

- [ ] **Step 4: Thêm `enqueueIfAllFeedbacksReady` vào report.service.ts**

Mở `server/src/report/report.service.ts`, thêm method sau `enqueueReport`:

```ts
async enqueueIfAllFeedbacksReady(
  sessionId: string,
  sessionType: string,
  contextPack: 'VN' | 'Western',
): Promise<void> {
  const session = await this.prisma.interviewSession.findUnique({
    where: { id: sessionId },
    select: { status: true },
  });

  if (session?.status !== 'completing') return;

  const [totalAnswers, completedFeedbacks] = await Promise.all([
    this.prisma.userAnswer.count({ where: { sessionId } }),
    this.prisma.userAnswer.count({
      where: { sessionId, feedbackGenerated: true },
    }),
  ]);

  if (totalAnswers === 0 || completedFeedbacks < totalAnswers) return;

  await this.enqueueReport(sessionId, sessionType, contextPack);
}
```

- [ ] **Step 5: Chạy lại report tests**

```
cd server && npm test -- --testPathPattern=report.service.spec
```

Expected: tất cả tests PASS.

- [ ] **Step 6: Thêm test cho FeedbackProcessor — gọi enqueueIfAllFeedbacksReady**

Mở `server/src/ai/processors/feedback.processor.spec.ts`.

Thêm import `ReportService` và mock factory:

```ts
import { ReportService } from '../../report/report.service';
import { createMockReportService } from '../../test-utils/mock-factories';
```

Thêm biến mock trong describe block:

```ts
let mockReportService: ReturnType<typeof createMockReportService>;
```

Trong `beforeEach`, tạo mock và thêm vào providers:

```ts
mockReportService = createMockReportService();

const module: TestingModule = await Test.createTestingModule({
  providers: [
    FeedbackProcessor,
    { provide: PrismaService, useValue: mockPrisma },
    { provide: SseService, useValue: mockSse },
    { provide: ContextPackService, useValue: mockContextPack },
    { provide: PipelineStrategyFactory, useValue: mockFactory },
    { provide: ReportService, useValue: mockReportService },  // thêm dòng này
  ],
}).compile();
```

Thêm test case:

```ts
it('gọi enqueueIfAllFeedbacksReady sau khi feedback thành công', async () => {
  const mockStrategy = {
    evaluateAnswer: jest.fn().mockResolvedValue({
      overallScore: 80,
      modelAnswer: 'Model answer',
      keyTakeaway: 'Key point',
      promptVersion: 'v1.1',
      annotatedSegments: [],
    }),
  };
  mockContextPack.getContextPack.mockReturnValue({} as any);
  mockFactory.getStrategy.mockReturnValue(mockStrategy);
  mockPrisma.$transaction.mockImplementation(async (cb) => cb(mockPrisma));
  mockPrisma.aiFeedback.upsert.mockResolvedValue({ id: 'fb-1' });
  mockPrisma.annotatedSegment.deleteMany.mockResolvedValue({ count: 0 });
  mockPrisma.annotatedSegment.createMany.mockResolvedValue({ count: 0 });
  mockPrisma.userAnswer.update.mockResolvedValue({});
  mockSse.emit.mockResolvedValue(undefined);

  const job = {
    data: {
      sessionId: 'session-123',
      turnId: 'turn-1',
      answerId: 'answer-1',
      questionText: 'Tell me about yourself?',
      answerText: 'I am a developer.',
      contextPack: 'VN' as const,
      sessionType: 'hr' as const,
    },
    attemptsMade: 0,
    opts: { attempts: 2 },
  } as unknown as Job<any>;

  await processor.process(job);

  expect(mockReportService.enqueueIfAllFeedbacksReady).toHaveBeenCalledWith(
    'session-123',
    'hr',
    'VN',
  );
});
```

- [ ] **Step 7: Chạy test để xác nhận FAIL**

```
cd server && npm test -- --testPathPattern=feedback.processor.spec
```

Expected: test mới FAIL — `FeedbackProcessor` chưa inject `ReportService`.

- [ ] **Step 8: Cập nhật FeedbackProcessor để inject ReportService và gọi enqueueIfAllFeedbacksReady**

Mở `server/src/ai/processors/feedback.processor.ts`:

Thêm import:
```ts
import { ReportService } from '../../report/report.service';
```

Thêm vào constructor:
```ts
constructor(
  private readonly prisma: PrismaService,
  private readonly sseService: SseService,
  private readonly contextPackService: ContextPackService,
  private readonly factory: PipelineStrategyFactory,
  private readonly reportService: ReportService,
) {
  super();
}
```

Trong method `process()`, sau `await this.emitFeedbackReady(...)` ở **cả** success path (line ~106) **và** fallback path (line ~168), thêm:

```ts
await this.reportService
  .enqueueIfAllFeedbacksReady(sessionId, sessionType, contextPack)
  .catch((err: unknown) => {
    this.logger.warn(
      `Failed to check report readiness for session ${sessionId}`,
      err instanceof Error ? err.message : String(err),
    );
  });
```

Lưu ý: call này không được throw — dùng `.catch()` để log warning và tiếp tục. Report job idempotent nên double-call từ race condition là safe.

- [ ] **Step 9: Wire AiModule import ReportModule**

Mở `server/src/ai/ai.module.ts`, thêm `ReportModule` vào imports.

Kiểm tra `server/src/report/report.module.ts` có export `ReportService` chưa — nếu chưa, thêm vào `exports: [ReportService]`.

- [ ] **Step 10: Cập nhật session.service.ts — dùng enqueueIfAllFeedbacksReady thay vì enqueueReport**

Trong `server/src/session/session.service.ts`, tìm tất cả lời gọi `this.reportService.enqueueReport(...)` trong method `updateStatus()` (hiện có 2 chỗ: line ~183 và line ~212) và đổi thành `this.reportService.enqueueIfAllFeedbacksReady(...)`.

- [ ] **Step 11: Giảm REPORT_JOB_ATTEMPTS từ 20 xuống 3**

```ts
// server/src/common/constants/queue.constants.ts
export const REPORT_JOB_ATTEMPTS = 3;  // đổi từ 20
```

- [ ] **Step 12: Chạy toàn bộ test suite**

```
cd server && npm test
```

Expected: tất cả tests PASS. Nếu có test nào trong `session.service.spec.ts` mock `reportService.enqueueReport` nhưng không mock `enqueueIfAllFeedbacksReady`, sửa mock đó.

- [ ] **Step 13: Commit**

```
git add server/src/report/report.service.ts \
        server/src/report/report.service.spec.ts \
        server/src/ai/processors/feedback.processor.ts \
        server/src/ai/processors/feedback.processor.spec.ts \
        server/src/ai/ai.module.ts \
        server/src/session/session.service.ts \
        server/src/common/constants/queue.constants.ts \
        server/src/test-utils/mock-factories.ts
git commit -m "feat: trigger report generation from FeedbackProcessor instead of retry loop"
```

---

## Task 5: Report quality signal — Thêm field `reportQuality`

**Files:**
- Modify: `server/src/report/dto/report-response.dto.ts`
- Modify: `server/src/report/report.service.ts`
- Modify: `server/src/report/report.service.spec.ts`

**Interfaces:**
- Produces: `ReportResponseDto` có thêm field `reportQuality: 'full' | 'partial' | 'unavailable'`

---

- [ ] **Step 1: Xem cấu trúc hiện tại của `report-response.dto.ts`**

Đọc file `server/src/report/dto/report-response.dto.ts` để xác định các fields hiện có.

- [ ] **Step 2: Thêm test case vào report.service.spec.ts**

Trong describe `getReport`, thêm:

```ts
it('trả về reportQuality=full khi không có fallback feedbacks', async () => {
  mockPrisma.interviewSession.findUnique.mockResolvedValue(COMPLETED_SESSION);
  mockPrisma.sessionQuestion.findMany.mockResolvedValue([
    {
      id: 'q-1',
      questionText: 'Question 1',
      orderIndex: 1,
      userAnswers: [
        {
          answerText: 'Answer',
          aiFeedback: {
            overallScore: 80,
            modelAnswer: 'Model',
            keyTakeaway: 'Key',
            isFallback: false,
            annotatedSegments: [],
          },
        },
      ],
    },
  ]);

  const result = await service.getReport('session-123', 'user-abc');

  expect(result.reportQuality).toBe('full');
});

it('trả về reportQuality=unavailable khi tất cả feedbacks là fallback', async () => {
  mockPrisma.interviewSession.findUnique.mockResolvedValue(COMPLETED_SESSION);
  mockPrisma.sessionQuestion.findMany.mockResolvedValue([
    {
      id: 'q-1',
      questionText: 'Question 1',
      orderIndex: 1,
      userAnswers: [
        {
          answerText: 'Answer',
          aiFeedback: {
            overallScore: 0,
            modelAnswer: '',
            keyTakeaway: 'AI unavailable',
            isFallback: true,
            annotatedSegments: [],
          },
        },
      ],
    },
  ]);

  const result = await service.getReport('session-123', 'user-abc');

  expect(result.reportQuality).toBe('unavailable');
});

it('trả về reportQuality=partial khi một phần feedbacks là fallback', async () => {
  mockPrisma.interviewSession.findUnique.mockResolvedValue(COMPLETED_SESSION);
  mockPrisma.sessionQuestion.findMany.mockResolvedValue([
    {
      id: 'q-1',
      questionText: 'Q1',
      orderIndex: 1,
      userAnswers: [
        {
          answerText: 'A1',
          aiFeedback: { overallScore: 80, modelAnswer: 'M', keyTakeaway: 'K', isFallback: false, annotatedSegments: [] },
        },
      ],
    },
    {
      id: 'q-2',
      questionText: 'Q2',
      orderIndex: 2,
      userAnswers: [
        {
          answerText: 'A2',
          aiFeedback: { overallScore: 0, modelAnswer: '', keyTakeaway: 'AI unavailable', isFallback: true, annotatedSegments: [] },
        },
      ],
    },
  ]);

  const result = await service.getReport('session-123', 'user-abc');

  expect(result.reportQuality).toBe('partial');
});
```

- [ ] **Step 3: Chạy tests để xác nhận FAIL**

```
cd server && npm test -- --testPathPattern=report.service.spec
```

Expected: 3 tests mới FAIL — `reportQuality` chưa có trong response.

- [ ] **Step 4: Thêm `reportQuality` vào DTO**

Mở `server/src/report/dto/report-response.dto.ts`, thêm field:

```ts
reportQuality: 'full' | 'partial' | 'unavailable';
```

- [ ] **Step 5: Tính `reportQuality` trong report.service.ts**

Trong `getReport()`, sau khi tính `allFeedbackIsFallback` (line ~106-107), thêm:

```ts
const hasSomeFallback = transcript.some((item) => item.isFallback);
const hasSomeEvaluated = transcript.some((item) => !item.isFallback && item.overallScore !== null);

const reportQuality: 'full' | 'partial' | 'unavailable' =
  !hasSomeFallback ? 'full' :
  hasSomeEvaluated ? 'partial' :
  'unavailable';
```

Thêm `reportQuality` vào return object:

```ts
return {
  sessionId,
  reportQuality,
  overallScore: ...,
  ...
};
```

- [ ] **Step 6: Chạy lại tests**

```
cd server && npm test -- --testPathPattern=report.service.spec
```

Expected: tất cả tests PASS.

- [ ] **Step 7: Commit**

```
git add server/src/report/dto/report-response.dto.ts \
        server/src/report/report.service.ts \
        server/src/report/report.service.spec.ts
git commit -m "feat: add reportQuality field to report response (full/partial/unavailable)"
```

---

## Task 6: Async voice transcription — Tách Whisper ra BullMQ queue riêng

**Files:**
- Modify: `server/prisma/schema.prisma` (thêm `transcriptionStatus`)
- Create: `server/prisma/migrations/<timestamp>_add_transcription_status/migration.sql`
- Modify: `server/src/common/constants/queue.constants.ts`
- Create: `server/src/ai/processors/transcription.processor.ts`
- Create: `server/src/ai/processors/transcription.processor.spec.ts`
- Modify: `server/src/turn/turn.service.ts`
- Modify: `server/src/turn/dto/turn-response.dto.ts`
- Modify: `server/src/ai/ai.module.ts`
- Modify: `server/src/app.module.ts`

**Interfaces:**
- Produces: POST /turns với `answerMode=voice` trả về `{ answerId, transcriptionPending: true, feedbackQueued: false, followUpQueued: false }` trong ≤200ms
- Produces: `TranscriptionProcessor` gọi Whisper, cập nhật `UserAnswer`, enqueue feedback + follow-up, emit SSE `turn.transcription_ready`
- Consumes: `FOLLOW_UP_JOB_ATTEMPTS`, `FEEDBACK_JOB_ATTEMPTS`, `FOLLOW_UP_QUEUE`, `FEEDBACK_QUEUE` từ queue.constants.ts

**Cảnh báo:** Task này yêu cầu Prisma migration. Chạy migration trước khi viết code.

---

- [ ] **Step 1: Thêm `TRANSCRIPTION_QUEUE` vào queue.constants.ts**

```ts
// server/src/common/constants/queue.constants.ts
export const QUESTION_GEN_QUEUE = 'question-generation';
export const FOLLOW_UP_QUEUE = 'follow-up';
export const FEEDBACK_QUEUE = 'feedback';
export const REPORT_QUEUE = 'comprehensive-report';
export const TRANSCRIPTION_QUEUE = 'transcription';      // thêm
export const REWRITE_EVAL_QUEUE = 'rewrite-eval';

export const FEEDBACK_JOB_ATTEMPTS = 2;
export const QUESTION_GEN_JOB_ATTEMPTS = 2;
export const FOLLOW_UP_JOB_ATTEMPTS = 2;
export const TRANSCRIPTION_JOB_ATTEMPTS = 2;             // thêm
export const REPORT_JOB_ATTEMPTS = 3;
export const REPORT_JOB_RETRY_DELAY_MS = 3_000;
```

- [ ] **Step 2: Thêm `transcriptionStatus` vào Prisma schema**

Mở `server/prisma/schema.prisma`, tìm model `UserAnswer`, thêm field:

```prisma
model UserAnswer {
  // ... existing fields ...
  transcriptionStatus String?  @map("transcription_status")
  // ...
}
```

- [ ] **Step 3: Chạy Prisma migration**

```
cd server && npx prisma migrate dev --name add_transcription_status_to_user_answer
```

Expected: migration file được tạo trong `server/prisma/migrations/`, schema được áp dụng.

- [ ] **Step 4: Thêm `transcriptionPending` vào TurnResponseDto**

Mở `server/src/turn/dto/turn-response.dto.ts`, thêm:

```ts
transcriptionPending: boolean;
```

- [ ] **Step 5: Viết test cho TranscriptionProcessor**

```ts
// server/src/ai/processors/transcription.processor.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { TranscriptionProcessor } from './transcription.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { WhisperService } from '../../turn/whisper.service';
import { VoiceMetricsService } from '../../turn/voice-metrics.service';
import { FollowUpCoordinatorService } from '../../turn/follow-up-coordinator.service';
import {
  FEEDBACK_QUEUE,
  FOLLOW_UP_QUEUE,
  FEEDBACK_JOB_ATTEMPTS,
  FOLLOW_UP_JOB_ATTEMPTS,
} from '../../common/constants/queue.constants';
import {
  createMockPrismaService,
  createMockSseService,
  createMockWhisperService,
  createMockVoiceMetricsService,
  createMockFollowUpCoordinatorService,
  createMockQueue,
} from '../../test-utils/mock-factories';

const BASE_JOB_DATA = {
  sessionId: 'session-123',
  answerId: 'answer-1',
  audioFileUrl: 'https://example.com/audio.mp3',
  audioDurationSeconds: 60,
  audioSizeBytes: 1024,
  contextPack: 'VN' as const,
  sessionType: 'hr' as const,
};

describe('TranscriptionProcessor', () => {
  let processor: TranscriptionProcessor;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockSse: ReturnType<typeof createMockSseService>;
  let mockWhisper: ReturnType<typeof createMockWhisperService>;
  let mockVoiceMetrics: ReturnType<typeof createMockVoiceMetricsService>;
  let mockFollowUpCoordinator: ReturnType<typeof createMockFollowUpCoordinatorService>;
  let mockFeedbackQueue: ReturnType<typeof createMockQueue>;
  let mockFollowUpQueue: ReturnType<typeof createMockQueue>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockSse = createMockSseService();
    mockWhisper = createMockWhisperService();
    mockVoiceMetrics = createMockVoiceMetricsService();
    mockFollowUpCoordinator = createMockFollowUpCoordinatorService();
    mockFeedbackQueue = createMockQueue();
    mockFollowUpQueue = createMockQueue();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptionProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SseService, useValue: mockSse },
        { provide: WhisperService, useValue: mockWhisper },
        { provide: VoiceMetricsService, useValue: mockVoiceMetrics },
        { provide: FollowUpCoordinatorService, useValue: mockFollowUpCoordinator },
        { provide: getQueueToken(FEEDBACK_QUEUE), useValue: mockFeedbackQueue },
        { provide: getQueueToken(FOLLOW_UP_QUEUE), useValue: mockFollowUpQueue },
      ],
    }).compile();

    processor = module.get<TranscriptionProcessor>(TranscriptionProcessor);
  });

  afterEach(() => jest.clearAllMocks());

  it('transcribe audio, cập nhật answer, enqueue feedback, emit SSE', async () => {
    mockWhisper.transcribe.mockResolvedValue({ text: 'Transcribed text', durationSeconds: 60 });
    mockVoiceMetrics.calculate.mockReturnValue({ wpm: 120, fillerWordCount: 2 });
    mockPrisma.userAnswer.update.mockResolvedValue({
      id: 'answer-1',
      sessionId: 'session-123',
      questionId: 'q-1',
      answerText: 'Transcribed text',
    });
    mockPrisma.sessionQuestion.findFirst.mockResolvedValue({
      id: 'q-1',
      questionText: 'Tell me about yourself?',
      orderIndex: 1,
      sessionId: 'session-123',
    });
    mockPrisma.interviewSession.findUnique.mockResolvedValue({
      id: 'session-123',
      numQuestions: 5,
    });
    mockFollowUpCoordinator.shouldGenerateFollowUp.mockReturnValue(false);
    mockSse.emit.mockResolvedValue(undefined);
    mockFeedbackQueue.add.mockResolvedValue({} as any);

    const job = { data: BASE_JOB_DATA, attemptsMade: 0, opts: { attempts: 2 } } as unknown as Job<typeof BASE_JOB_DATA>;
    await processor.process(job);

    expect(mockWhisper.transcribe).toHaveBeenCalledWith('https://example.com/audio.mp3');
    expect(mockPrisma.userAnswer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'answer-1' },
        data: expect.objectContaining({
          answerText: 'Transcribed text',
          transcriptionStatus: 'done',
        }),
      }),
    );
    expect(mockFeedbackQueue.add).toHaveBeenCalledWith(
      'feedback',
      expect.objectContaining({ answerId: 'answer-1' }),
      expect.objectContaining({ jobId: 'feedback-answer-1', attempts: FEEDBACK_JOB_ATTEMPTS }),
    );
    expect(mockSse.emit).toHaveBeenCalledWith(
      'sse:session:session-123',
      'turn.transcription_ready',
      expect.objectContaining({ answerId: 'answer-1' }),
    );
  });
});
```

- [ ] **Step 6: Chạy test để xác nhận FAIL (file chưa tồn tại)**

```
cd server && npm test -- --testPathPattern=transcription.processor.spec
```

Expected: FAIL — module không tìm thấy.

- [ ] **Step 7: Tạo TranscriptionProcessor**

```ts
// server/src/ai/processors/transcription.processor.ts
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { SseService } from '../../common/services/sse.service';
import { WhisperService } from '../../turn/whisper.service';
import { VoiceMetricsService } from '../../turn/voice-metrics.service';
import { FollowUpCoordinatorService } from '../../turn/follow-up-coordinator.service';
import {
  TRANSCRIPTION_QUEUE,
  FEEDBACK_QUEUE,
  FOLLOW_UP_QUEUE,
  FEEDBACK_JOB_ATTEMPTS,
  FOLLOW_UP_JOB_ATTEMPTS,
} from '../../common/constants/queue.constants';
import type { SessionType } from '../pipelines/interview-pipeline.interface';

interface TranscriptionJobDto {
  sessionId: string;
  answerId: string;
  audioFileUrl: string;
  audioDurationSeconds?: number;
  audioSizeBytes?: number;
  contextPack: 'VN' | 'Western';
  sessionType: SessionType;
}

@Processor(TRANSCRIPTION_QUEUE)
export class TranscriptionProcessor extends WorkerHost {
  private readonly logger = new Logger(TranscriptionProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sseService: SseService,
    private readonly whisperService: WhisperService,
    private readonly voiceMetricsService: VoiceMetricsService,
    private readonly followUpCoordinatorService: FollowUpCoordinatorService,
    @InjectQueue(FEEDBACK_QUEUE) private readonly feedbackQueue: Queue,
    @InjectQueue(FOLLOW_UP_QUEUE) private readonly followUpQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<TranscriptionJobDto>): Promise<void> {
    const {
      sessionId,
      answerId,
      audioFileUrl,
      audioDurationSeconds: hintDuration,
      contextPack,
      sessionType,
    } = job.data;

    const transcription = await this.whisperService.transcribe(audioFileUrl);
    const answerText = transcription.text;
    const durationSeconds = hintDuration ?? transcription.durationSeconds;
    const voiceMetricsJson = this.voiceMetricsService.calculate(
      answerText,
      durationSeconds,
    );

    const answer = await this.prisma.userAnswer.update({
      where: { id: answerId },
      data: {
        answerText,
        audioDurationSeconds: durationSeconds,
        voiceMetricsJson,
        transcriptionStatus: 'done',
      },
    });

    const question = await this.prisma.sessionQuestion.findFirst({
      where: { id: answer.questionId, sessionId },
    });

    if (!question) {
      this.logger.warn(
        `Question not found for answer ${answerId} in session ${sessionId}, skipping follow-up`,
      );
      await this.enqueueFeedback(answerId, sessionId, question?.questionText ?? '', answerText, contextPack, sessionType);
      await this.emitTranscriptionReady(sessionId, answerId);
      return;
    }

    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: { numQuestions: true },
    });

    const jobBase = {
      sessionId,
      turnId: answerId,
      answerId,
      questionText: question.questionText,
      answerText,
      contextPack,
      sessionType,
    };

    const followUpEnabled = this.followUpCoordinatorService.shouldGenerateFollowUp(
      answerText,
      question.orderIndex,
      session?.numQuestions ?? 0,
    );

    if (followUpEnabled) {
      await this.followUpQueue.add('follow-up', jobBase, {
        jobId: `follow-up-${answerId}`,
        attempts: FOLLOW_UP_JOB_ATTEMPTS,
        backoff: { type: 'fixed', delay: 2000 },
      });
    }

    await this.feedbackQueue.add('feedback', jobBase, {
      jobId: `feedback-${answerId}`,
      attempts: FEEDBACK_JOB_ATTEMPTS,
      backoff: { type: 'fixed', delay: 2000 },
    });

    await this.emitTranscriptionReady(sessionId, answerId);
  }

  private async enqueueFeedback(
    answerId: string,
    sessionId: string,
    questionText: string,
    answerText: string,
    contextPack: 'VN' | 'Western',
    sessionType: SessionType,
  ): Promise<void> {
    await this.feedbackQueue.add(
      'feedback',
      { sessionId, turnId: answerId, answerId, questionText, answerText, contextPack, sessionType },
      { jobId: `feedback-${answerId}`, attempts: FEEDBACK_JOB_ATTEMPTS, backoff: { type: 'fixed', delay: 2000 } },
    );
  }

  private async emitTranscriptionReady(sessionId: string, answerId: string): Promise<void> {
    await this.sseService
      .emit(`sse:session:${sessionId}`, 'turn.transcription_ready', { answerId })
      .catch((err: unknown) => {
        this.logger.warn(
          `Unable to emit transcription_ready for answer ${answerId}`,
          err instanceof Error ? err.message : String(err),
        );
      });
  }
}
```

- [ ] **Step 8: Cập nhật TurnService — tách voice path**

Trong `server/src/turn/turn.service.ts`:

Thêm import:
```ts
import {
  FOLLOW_UP_QUEUE,
  FEEDBACK_QUEUE,
  FEEDBACK_JOB_ATTEMPTS,
  FOLLOW_UP_JOB_ATTEMPTS,
  TRANSCRIPTION_QUEUE,
  TRANSCRIPTION_JOB_ATTEMPTS,
} from '../common/constants/queue.constants';
```

Thêm `@InjectQueue(TRANSCRIPTION_QUEUE) private readonly transcriptionQueue: Queue` vào constructor.

Thay thế voice path (lines 83-96) — đổi từ gọi Whisper sync sang enqueue:

```ts
if (dto.answerMode === 'voice' && dto.audioFileUrl) {
  // Tạo answer với placeholder, transcription xử lý async
  answer = await this.prisma.userAnswer.upsert({
    where: {
      sessionId_questionId: { sessionId, questionId: dto.questionId },
    },
    create: {
      sessionId,
      questionId: dto.questionId,
      answerMode: dto.answerMode,
      answerText: '',
      audioFileUrl: dto.audioFileUrl,
      audioDurationSeconds: dto.audioDurationSeconds,
      audioSizeBytes: dto.audioSizeBytes,
      transcriptionStatus: 'pending',
    },
    update: {},
  });

  await this.transcriptionQueue.add(
    'transcription',
    {
      sessionId,
      answerId: answer.id,
      audioFileUrl: dto.audioFileUrl,
      audioDurationSeconds: dto.audioDurationSeconds,
      audioSizeBytes: dto.audioSizeBytes,
      contextPack,
      sessionType,
    },
    {
      jobId: `transcription-${answer.id}`,
      attempts: TRANSCRIPTION_JOB_ATTEMPTS,
      backoff: { type: 'fixed', delay: 3000 },
    },
  );

  return {
    answerId: answer.id,
    followUpQueued: false,
    feedbackQueued: false,
    transcriptionPending: true,
  };
} else {
  answerText = dto.answerText ?? '';
}
```

Với text mode (else branch), luồng tiếp tục như cũ đến hết method. Text mode return:

```ts
return {
  answerId: answer.id,
  followUpQueued: followUpEnabled,
  feedbackQueued: true,
  transcriptionPending: false,
};
```

Sau khi tách voice path, xóa `WhisperService` và `VoiceMetricsService` khỏi constructor của `TurnService` (chúng giờ chỉ dùng trong `TranscriptionProcessor`).

- [ ] **Step 9: Đăng ký TranscriptionProcessor và queue trong modules**

Trong `server/src/ai/ai.module.ts`:
- Thêm `BullModule.registerQueue({ name: TRANSCRIPTION_QUEUE })` vào imports
- Thêm `TranscriptionProcessor` vào providers

Trong `server/src/app.module.ts` hoặc nơi đăng ký queues, thêm `TRANSCRIPTION_QUEUE`.

Trong `server/src/turn/turn.module.ts`:
- Thêm `BullModule.registerQueue({ name: TRANSCRIPTION_QUEUE })` (turn service cần inject queue này)
- Xóa `WhisperService` và `VoiceMetricsService` khỏi providers nếu chỉ dùng trong AiModule

- [ ] **Step 10: Cập nhật CLAUDE.md ai module**

Trong `server/src/ai/CLAUDE.md`, thêm vào bảng Processors:

```
| `TranscriptionProcessor` | `transcription` | 30s | 2 | POST /turns (voice) |
```

- [ ] **Step 11: Chạy toàn bộ test suite**

```
cd server && npm test
```

Expected: tất cả tests PASS. Có thể cần update `turn.service.spec.ts` nếu test nào mock `WhisperService` mà nay service không còn inject nó.

- [ ] **Step 12: Commit**

```
git add server/prisma/schema.prisma \
        server/prisma/migrations/ \
        server/src/common/constants/queue.constants.ts \
        server/src/ai/processors/transcription.processor.ts \
        server/src/ai/processors/transcription.processor.spec.ts \
        server/src/ai/ai.module.ts \
        server/src/turn/turn.service.ts \
        server/src/turn/turn.service.spec.ts \
        server/src/turn/dto/turn-response.dto.ts \
        server/src/app.module.ts \
        server/src/ai/CLAUDE.md
git commit -m "feat: async voice transcription via BullMQ TranscriptionProcessor"
```

---

## Task 7: Dead code cleanup — Xóa RewriteEvalProcessor và reverseQEvalJson

**Files:**
- Delete: `server/src/ai/processors/rewrite-eval.processor.ts`
- Delete: `server/src/ai/processors/rewrite-eval.processor.spec.ts`
- Modify: `server/prisma/schema.prisma`
- Create: migration xóa `reverse_q_eval_json` column và bảng `reverse_questions`
- Modify: `server/src/common/constants/queue.constants.ts`
- Modify: `server/src/ai/ai.module.ts`

**Cảnh báo:** Migration này DROP TABLE và DROP COLUMN — kiểm tra không có data quan trọng trước khi chạy.

---

- [ ] **Step 1: Xóa processor files**

```
cd server && rm src/ai/processors/rewrite-eval.processor.ts
cd server && rm src/ai/processors/rewrite-eval.processor.spec.ts
```

- [ ] **Step 2: Xóa REWRITE_EVAL_QUEUE khỏi queue.constants.ts**

Xóa dòng:
```ts
export const REWRITE_EVAL_QUEUE = 'rewrite-eval';
```

- [ ] **Step 3: Xóa RewriteEvalProcessor khỏi ai.module.ts**

Mở `server/src/ai/ai.module.ts`, xóa:
- Import của `RewriteEvalProcessor`
- Entry trong `providers: [...]`
- Nếu có `BullModule.registerQueue({ name: REWRITE_EVAL_QUEUE })` trong imports, xóa luôn

- [ ] **Step 4: Xóa reverseQEvalJson và ReverseQuestion khỏi Prisma schema**

Mở `server/prisma/schema.prisma`:
- Xóa field `reverseQEvalJson` khỏi model `InterviewSession`
- Xóa model `ReverseQuestion` hoàn toàn
- Xóa relation `reverseQuestions` khỏi `InterviewSession`

- [ ] **Step 5: Chạy migration**

```
cd server && npx prisma migrate dev --name remove_reverse_question_artifacts
```

Expected: migration SQL có `ALTER TABLE interview_sessions DROP COLUMN reverse_q_eval_json` và `DROP TABLE reverse_questions`.

- [ ] **Step 6: Chạy toàn bộ test suite để xác nhận không có regression**

```
cd server && npm test
```

Expected: tất cả tests PASS. Không có import nào còn reference `RewriteEvalProcessor` hay `REWRITE_EVAL_QUEUE`.

- [ ] **Step 7: Cập nhật CLAUDE.md**

Trong `server/src/ai/CLAUDE.md`, xóa `RewriteEvalProcessor` khỏi bảng Processors.
Trong `server/CLAUDE.md`, xóa `ReverseQuestion` khỏi Models list.

- [ ] **Step 8: Commit**

```
git add server/src/ai/processors/ \
        server/src/ai/ai.module.ts \
        server/src/common/constants/queue.constants.ts \
        server/prisma/schema.prisma \
        server/prisma/migrations/ \
        server/src/ai/CLAUDE.md \
        server/CLAUDE.md
git commit -m "chore: remove unused RewriteEvalProcessor and reverseQEvalJson artifacts"
```

---

## Self-Review

### Spec coverage

| Vấn đề | Task | Covered? |
|--------|------|---------|
| 1. Report retry loop | Task 4 | Có — `enqueueIfAllFeedbacksReady` + REPORT_JOB_ATTEMPTS = 3 |
| 2. Voice sync transcription | Task 6 | Có — `TranscriptionProcessor` |
| 3. Follow-up reliability | Task 3 | Có — retry + graceful degradation |
| 4. answerText validation | Task 1 | Có — `@MinLength(10)` |
| 5. Session generating state | Task 2 | Có — chặn 'generating' |
| 6. Dead code | Task 7 | Có — xóa RewriteEvalProcessor + migration |
| 7. Report quality signal | Task 5 | Có — `reportQuality` field |
| 8. SSE fan-out (minor) | Không có task | Không include — scope nhỏ, impact thấp ở scale MVP |

### Placeholder scan

Không có TBD, TODO, hay "implement later" trong plan này.

### Type consistency

- `FOLLOW_UP_JOB_ATTEMPTS` khai báo ở Task 3, dùng ở Task 3 và Task 6
- `TRANSCRIPTION_QUEUE`, `TRANSCRIPTION_JOB_ATTEMPTS` khai báo ở Task 6 step 1, dùng ở steps 7-8
- `enqueueIfAllFeedbacksReady` signature: `(sessionId: string, sessionType: string, contextPack: 'VN' | 'Western') => Promise<void>` — nhất quán ở Tasks 4 và mock-factories
- `reportQuality: 'full' | 'partial' | 'unavailable'` — nhất quán ở Tasks 5 DTO và service

---

## Tiến độ Thực hiện

| Task | Trạng thái | Commit | Tests | Ghi chú |
|------|-----------|--------|-------|---------|
| 1 — MinLength validation | DONE | 08d22a0 | 4 pass | review clean |
| 2 — Chặn 'generating' | DONE | fb92f89 | 10 pass | review clean |
| 3 — Follow-up retry | DONE | 00178a1 | 6 pass | review clean |
| 4 — Event-driven report | DONE | 8962241 | 170 pass | review clean |
| 5 — reportQuality field | DONE | 3670a05..09b52b7 | 18 pass | review clean |
| 6 — Async transcription | DONE | faf1226..7afa718 | 179 pass | review clean |
| 6 Minors — Cleanup Task 6 | DONE | pending commit | 179 pass | 3 minors fixed (xem bên dưới) |
| 7 — Dead code cleanup | PENDING | — | — | bước tiếp theo |

**Cập nhật lần cuối:** 2026-06-21

---

### Chi tiết Task 6 Minors — Đã fix

Ba vấn đề nhỏ từ review Task 6 đã được xử lý:

1. **FIXED** — Xóa `WhisperService` và `VoiceMetricsService` khỏi `TurnModule.providers`. Hai service này chỉ dùng trong `TranscriptionProcessor` (AiModule), không cần khai báo lại trong TurnModule.

2. **FIXED** — Export `TranscriptionJobDto` interface từ `transcription.processor.ts` (thêm `export`). `TurnService` import và dùng type này để annotate hai payload objects (retry path và new-answer path), tránh duplicate shape definition.

3. **FIXED** — Migration `20260621000000_add_transcription_status/migration.sql` đã đổi về chuẩn `ADD COLUMN`. Migration trước đó chưa được Prisma track (`prisma migrate status` trả về "not yet applied"). Đã chạy `prisma migrate resolve --applied 20260621000000_add_transcription_status` để track với checksum chuẩn. `prisma migrate status` xác nhận "Database schema is up to date".

---

### Quyết định quan trọng trong quá trình thực hiện

**Task 4 — Thay đổi trigger report từ SessionService sang FeedbackProcessor:**

SessionService ban đầu enqueue report ngay khi user PATCH `completed`. Điều này tạo race condition vì feedback jobs có thể chưa xong. Giải pháp: thêm `enqueueIfAllFeedbacksReady()` vào `ReportService`, gọi sau mỗi feedback completion (cả success lẫn fallback path). Method này check `session.status === 'completing'` và so sánh `feedbackGenerated` count trước khi enqueue — đảm bảo report chỉ được tạo một lần sau khi tất cả feedbacks xong. `REPORT_JOB_ATTEMPTS` giảm từ 20 xuống 3 vì không còn cần retry để chờ feedbacks.

**Task 6 — Circular dependency giữa AiModule và TurnModule:**

`TranscriptionProcessor` cần `WhisperService` và `VoiceMetricsService` từ `TurnModule`. Nhưng `TurnModule` đã import `AiModule`, nên không thể import ngược lại. Giải pháp: thêm `WhisperService` và `VoiceMetricsService` trực tiếp vào `AiModule.providers` (dual-instantiation — cả hai service là stateless nên không có side effect). `FollowUpCoordinatorService` giữ nguyên trong `TurnModule` vì `TurnService` vẫn dùng nó cho text-mode follow-up logic.

**Task 6 — Voice retry idempotency:**

Review phát hiện: khi client retry `POST /turns` voice sau khi transcription đã xong nhưng HTTP response bị mất, response trả về `transcriptionPending: true` (sai). Fix thêm: check `existingAnswer.transcriptionStatus === 'done'` → trả về `{ transcriptionPending: false, feedbackQueued: true }` ngay, không enqueue lại. Nếu `'pending'`, re-enqueue vào `transcriptionQueue` (BullMQ dedup qua `jobId` xử lý safe).

---

### Bước tiếp theo — Task 7: Dead code cleanup

Gồm 8 bước, có 2 thao tác destructive cần chú ý:

**Các thay đổi code (an toàn):**
- Xóa `server/src/ai/processors/rewrite-eval.processor.ts`
- Xóa `server/src/ai/processors/rewrite-eval.processor.spec.ts`
- Xóa `REWRITE_EVAL_QUEUE` khỏi `queue.constants.ts`
- Xóa `RewriteEvalProcessor` import + provider khỏi `ai.module.ts`

**Migration destructive (cần xác nhận trước khi chạy trên shared DB):**
- DROP COLUMN `reverse_q_eval_json` khỏi bảng `interview_sessions`
- DROP TABLE `reverse_questions`

Lưu ý tương tự Task 6: `prisma migrate dev` có thể bị block do DB drift — chuẩn bị dùng `prisma db execute` với SQL thủ công nếu cần.
