import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { SessionService } from './session.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReferenceDataService } from '../prisma/reference-data.service';
import { ReportService } from '../report/report.service';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { QUESTION_GEN_QUEUE } from '../common/constants/queue.constants';
import {
  createMockPrismaService,
  createMockQueue,
  createMockReportService,
} from '../test-utils/mock-factories';

const BASE_SESSION = {
  id: 'session-123',
  userId: 'user-abc',
  jobDescription: 'a'.repeat(100),
  sessionType: 'hr' as const,
  contextPackId: 'VN',
  status: 'generating',
  numQuestions: 5,
  createdAt: new Date(),
  overallScore: null,
  executiveSummaryJson: null,
  competencyHeatmapJson: null,
  actionPlanJson: null,
  completedAt: null,
  jdSource: 'paste',
};

const CREATE_DTO = {
  jobDescription: 'a'.repeat(100),
  sessionType: 'hr' as const,
  contextPack: 'VN' as const,
  numQuestions: 5,
};

describe('SessionService', () => {
  let service: SessionService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockQuestionQueue: ReturnType<typeof createMockQueue>;
  let mockReportService: ReturnType<typeof createMockReportService>;
  let mockReferenceData: { ensureContextPack: jest.Mock };

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockQuestionQueue = createMockQueue();
    mockReportService = createMockReportService();
    mockReferenceData = {
      ensureContextPack: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ReferenceDataService, useValue: mockReferenceData },
        {
          provide: getQueueToken(QUESTION_GEN_QUEUE),
          useValue: mockQuestionQueue,
        },
        { provide: ReportService, useValue: mockReportService },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('tạo session thành công khi đếm < 10', async () => {
      mockPrisma.interviewSession.count.mockResolvedValue(5);
      mockPrisma.interviewSession.create.mockResolvedValue(BASE_SESSION);
      mockQuestionQueue.add.mockResolvedValue({});

      const result = await service.create('user-abc', CREATE_DTO);

      expect(mockPrisma.interviewSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-abc',
            status: 'generating',
          }),
        }),
      );
      expect(result).toEqual(BASE_SESSION);
      expect(mockReferenceData.ensureContextPack).toHaveBeenCalledWith('VN');
    });

    it('enqueue question-generation job sau khi tạo', async () => {
      mockPrisma.interviewSession.count.mockResolvedValue(0);
      mockPrisma.interviewSession.create.mockResolvedValue(BASE_SESSION);
      mockQuestionQueue.add.mockResolvedValue({});

      await service.create('user-abc', CREATE_DTO);

      expect(mockQuestionQueue.add).toHaveBeenCalledWith(
        'question-generation',
        expect.objectContaining({ sessionId: 'session-123' }),
        expect.any(Object),
      );
    });

    it('throw SESSION_LIMIT_EXCEEDED (429) khi count = 10', async () => {
      mockPrisma.interviewSession.count.mockResolvedValue(10);

      await expect(service.create('user-abc', CREATE_DTO)).rejects.toThrow(
        InterviewAIException,
      );

      mockPrisma.interviewSession.count.mockResolvedValue(10);
      try {
        await service.create('user-abc', CREATE_DTO);
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(
          ErrorCode.SESSION_LIMIT_EXCEEDED,
        );
        expect((e as InterviewAIException).getStatus()).toBe(
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    });

    it('không throw khi count = 9', async () => {
      mockPrisma.interviewSession.count.mockResolvedValue(9);
      mockPrisma.interviewSession.create.mockResolvedValue(BASE_SESSION);
      mockQuestionQueue.add.mockResolvedValue({});

      await expect(
        service.create('user-abc', CREATE_DTO),
      ).resolves.toBeDefined();
    });

    it('đặt session status = error khi enqueue thất bại', async () => {
      mockPrisma.interviewSession.count.mockResolvedValue(0);
      mockPrisma.interviewSession.create.mockResolvedValue(BASE_SESSION);
      mockQuestionQueue.add.mockRejectedValue(new Error('Redis unavailable'));
      mockPrisma.interviewSession.update.mockResolvedValue({
        ...BASE_SESSION,
        status: 'error',
      });

      await expect(
        service.create('user-abc', CREATE_DTO),
      ).rejects.toMatchObject({ errorCode: ErrorCode.SERVICE_UNAVAILABLE });
      expect(mockPrisma.interviewSession.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'error' } }),
      );
    });

    it('trả SERVICE_UNAVAILABLE khi context pack không thể đồng bộ', async () => {
      mockPrisma.interviewSession.count.mockResolvedValue(0);
      mockReferenceData.ensureContextPack.mockRejectedValue(
        new Error('Database unavailable'),
      );

      await expect(
        service.create('user-abc', CREATE_DTO),
      ).rejects.toMatchObject({ errorCode: ErrorCode.SERVICE_UNAVAILABLE });
      expect(mockPrisma.interviewSession.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('trả về session khi tồn tại và user là chủ sở hữu', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      const result = await service.findById('session-123', 'user-abc');
      expect(result).toEqual(BASE_SESSION);
    });

    it('throw SESSION_NOT_FOUND (404) khi session không tồn tại', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(null);

      await expect(service.findById('bad-id', 'user-abc')).rejects.toThrow(
        InterviewAIException,
      );

      mockPrisma.interviewSession.findUnique.mockResolvedValue(null);
      try {
        await service.findById('bad-id', 'user-abc');
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(
          ErrorCode.SESSION_NOT_FOUND,
        );
        expect((e as InterviewAIException).getStatus()).toBe(
          HttpStatus.NOT_FOUND,
        );
      }
    });

    it('throw FORBIDDEN (403) khi user không phải chủ sở hữu', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);

      await expect(
        service.findById('session-123', 'other-user'),
      ).rejects.toThrow(InterviewAIException);

      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      try {
        await service.findById('session-123', 'other-user');
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(ErrorCode.FORBIDDEN);
        expect((e as InterviewAIException).getStatus()).toBe(
          HttpStatus.FORBIDDEN,
        );
      }
    });
  });

  describe('findAll', () => {
    it('trả về danh sách sessions theo createdAt desc', async () => {
      const sessions = [BASE_SESSION, { ...BASE_SESSION, id: 'session-456' }];
      mockPrisma.interviewSession.findMany.mockResolvedValue(sessions);

      const result = await service.findAll('user-abc');

      expect(mockPrisma.interviewSession.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-abc' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('trả về mảng rỗng khi không có sessions', async () => {
      mockPrisma.interviewSession.findMany.mockResolvedValue([]);
      const result = await service.findAll('user-abc');
      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('cập nhật status → active thành công', async () => {
      const updated = { ...BASE_SESSION, status: 'active' };
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.count.mockResolvedValue(5);
      mockPrisma.interviewSession.update.mockResolvedValue(updated);

      const result = await service.updateStatus(
        'session-123',
        'user-abc',
        'active',
      );
      expect(result.status).toBe('active');
      expect(mockPrisma.interviewSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { status: 'active', completedAt: null },
      });
    });

    it('chuyển active → completing và gọi ReportService khi đủ answer', async () => {
      const activeSession = { ...BASE_SESSION, status: 'active' };
      const updated = { ...BASE_SESSION, status: 'completing' };
      mockPrisma.interviewSession.findUnique.mockResolvedValue(activeSession);
      mockPrisma.sessionQuestion.count.mockResolvedValue(5);
      mockPrisma.userAnswer.count.mockResolvedValue(5);
      mockPrisma.interviewSession.update.mockResolvedValue(updated);
      mockReportService.enqueueReport.mockResolvedValue(undefined);

      const result = await service.updateStatus(
        'session-123',
        'user-abc',
        'completed',
      );

      expect(result.status).toBe('completing');
      expect(mockReportService.enqueueReport).toHaveBeenCalledWith(
        'session-123',
        'hr',
        'VN',
      );
    });

    it('KHÔNG enqueue report khi status → active', async () => {
      const updated = { ...BASE_SESSION, status: 'active' };
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);
      mockPrisma.sessionQuestion.count.mockResolvedValue(5);
      mockPrisma.interviewSession.update.mockResolvedValue(updated);

      await service.updateStatus('session-123', 'user-abc', 'active');

      expect(mockReportService.enqueueReport).not.toHaveBeenCalled();
    });

    it('từ chối generating → completed', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(BASE_SESSION);

      await expect(
        service.updateStatus('session-123', 'user-abc', 'completed'),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.INVALID_SESSION_TRANSITION,
      });
    });

    it('từ chối completed → active và giữ completedAt', async () => {
      const completedAt = new Date();
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...BASE_SESSION,
        status: 'completed',
        completedAt,
      });

      await expect(
        service.updateStatus('session-123', 'user-abc', 'active'),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.INVALID_SESSION_TRANSITION,
      });
      expect(mockPrisma.interviewSession.update).not.toHaveBeenCalled();
    });

    it('không hoàn thành session khi chưa trả lời đủ câu hỏi', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...BASE_SESSION,
        status: 'active',
      });
      mockPrisma.sessionQuestion.count.mockResolvedValue(5);
      mockPrisma.userAnswer.count.mockResolvedValue(4);

      await expect(
        service.updateStatus('session-123', 'user-abc', 'completed'),
      ).rejects.toMatchObject({ errorCode: ErrorCode.SESSION_INCOMPLETE });
      expect(mockReportService.enqueueReport).not.toHaveBeenCalled();
    });

    it('completed lặp lại không enqueue thêm report', async () => {
      const completed = { ...BASE_SESSION, status: 'completed' };
      mockPrisma.interviewSession.findUnique.mockResolvedValue(completed);

      const result = await service.updateStatus(
        'session-123',
        'user-abc',
        'completed',
      );

      expect(result).toBe(completed);
      expect(mockReportService.enqueueReport).not.toHaveBeenCalled();
    });

    it('khôi phục completing bằng cách đảm bảo report job tồn tại', async () => {
      const completing = { ...BASE_SESSION, status: 'completing' };
      mockPrisma.interviewSession.findUnique.mockResolvedValue(completing);
      mockReportService.enqueueReport.mockResolvedValue(undefined);

      await service.updateStatus('session-123', 'user-abc', 'completed');

      expect(mockReportService.enqueueReport).toHaveBeenCalledTimes(1);
    });
  });

  describe('findQuestions', () => {
    it('trả về danh sách câu hỏi đã map khi session tồn tại và đúng owner', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...BASE_SESSION,
        status: 'active',
      });
      mockPrisma.sessionQuestion.findMany.mockResolvedValue([
        {
          id: 'q-1',
          questionText: 'Giới thiệu bản thân?',
          orderIndex: 1,
          sessionId: 'session-123',
        },
        {
          id: 'q-2',
          questionText: 'Điểm mạnh của bạn?',
          orderIndex: 2,
          sessionId: 'session-123',
        },
      ]);

      const result = await service.findQuestions('session-123', 'user-abc');

      expect(result).toEqual([
        { id: 'q-1', content: 'Giới thiệu bản thân?', orderIndex: 1 },
        { id: 'q-2', content: 'Điểm mạnh của bạn?', orderIndex: 2 },
      ]);
      expect(mockPrisma.sessionQuestion.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-123' },
        orderBy: { orderIndex: 'asc' },
      });
      expect(mockPrisma.interviewSession.update).not.toHaveBeenCalled();
    });

    it('tự chuyển session ready sang active khi đã có câu hỏi', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...BASE_SESSION,
        status: 'ready',
      });
      mockPrisma.sessionQuestion.findMany.mockResolvedValue([
        {
          id: 'q-1',
          questionText: 'Giới thiệu bản thân?',
          orderIndex: 1,
          sessionId: 'session-123',
        },
      ]);
      mockPrisma.interviewSession.update.mockResolvedValue({
        ...BASE_SESSION,
        status: 'active',
      });

      await service.findQuestions('session-123', 'user-abc');

      expect(mockPrisma.interviewSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { status: 'active' },
      });
    });

    it('tự chuyển session generating sang active khi đã có câu hỏi', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...BASE_SESSION,
        status: 'generating',
      });
      mockPrisma.sessionQuestion.findMany.mockResolvedValue([
        {
          id: 'q-1',
          questionText: 'Giới thiệu bản thân?',
          orderIndex: 1,
          sessionId: 'session-123',
        },
      ]);
      mockPrisma.interviewSession.update.mockResolvedValue({
        ...BASE_SESSION,
        status: 'active',
      });

      await service.findQuestions('session-123', 'user-abc');

      expect(mockPrisma.interviewSession.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { status: 'active' },
      });
    });

    it('ném SESSION_NOT_FOUND khi session không tồn tại', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(null);

      await expect(
        service.findQuestions('nonexistent', 'user-abc'),
      ).rejects.toThrow(InterviewAIException);
    });

    it('ném FORBIDDEN khi user không phải owner', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...BASE_SESSION,
        userId: 'other-user',
      });

      await expect(
        service.findQuestions('session-123', 'user-abc'),
      ).rejects.toThrow(InterviewAIException);
    });
  });
});
