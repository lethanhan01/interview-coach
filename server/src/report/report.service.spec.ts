import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ReportService } from './report.service';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { REPORT_QUEUE } from '../common/constants/queue.constants';
import {
  createMockPrismaService,
  createMockQueue,
} from '../test-utils/mock-factories';

const COMPLETED_SESSION = {
  id: 'session-123',
  userId: 'user-abc',
  overallScore: 75,
  executiveSummaryJson: { summary: 'Good performance' },
  competencyHeatmapJson: { clarity: 80 },
  actionPlanJson: { actions: [] },
  status: 'completed',
};

describe('ReportService', () => {
  let service: ReportService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockReportQueue: ReturnType<typeof createMockQueue>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockReportQueue = createMockQueue();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken(REPORT_QUEUE), useValue: mockReportQueue },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getReport', () => {
    it('trả về report đầy đủ khi session hợp lệ và report sẵn sàng', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(
        COMPLETED_SESSION,
      );
      mockPrisma.sessionQuestion.findMany.mockResolvedValue([]);

      const result = await service.getReport('session-123', 'user-abc');

      expect(result.sessionId).toBe('session-123');
      expect(result.overallScore).toBe(75);
    });

    it('throw SESSION_NOT_FOUND (404) khi session không tồn tại', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(null);

      await expect(service.getReport('bad-id', 'user-abc')).rejects.toThrow(
        InterviewAIException,
      );

      mockPrisma.interviewSession.findUnique.mockResolvedValue(null);
      try {
        await service.getReport('bad-id', 'user-abc');
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
      mockPrisma.interviewSession.findUnique.mockResolvedValue(
        COMPLETED_SESSION,
      );

      await expect(
        service.getReport('session-123', 'other-user'),
      ).rejects.toThrow(InterviewAIException);

      mockPrisma.interviewSession.findUnique.mockResolvedValue(
        COMPLETED_SESSION,
      );
      try {
        await service.getReport('session-123', 'other-user');
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(ErrorCode.FORBIDDEN);
      }
    });

    it('throw REPORT_NOT_READY khi executiveSummaryJson là null', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...COMPLETED_SESSION,
        executiveSummaryJson: null,
      });

      await expect(
        service.getReport('session-123', 'user-abc'),
      ).rejects.toThrow(InterviewAIException);

      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...COMPLETED_SESSION,
        executiveSummaryJson: null,
      });
      try {
        await service.getReport('session-123', 'user-abc');
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(
          ErrorCode.REPORT_NOT_READY,
        );
      }
    });

    it('transcript rỗng khi không có questions', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(
        COMPLETED_SESSION,
      );
      mockPrisma.sessionQuestion.findMany.mockResolvedValue([]);

      const result = await service.getReport('session-123', 'user-abc');
      expect(result.transcript).toHaveLength(0);
    });

    it('chuẩn hóa các JSON object phụ bị null thành object rỗng', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...COMPLETED_SESSION,
        competencyHeatmapJson: null,
        actionPlanJson: null,
      });
      mockPrisma.sessionQuestion.findMany.mockResolvedValue([]);

      const result = await service.getReport('session-123', 'user-abc');

      expect(result.competencyHeatmap).toEqual({});
      expect(result.actionPlan).toEqual({});
    });

    it('transcript có đúng số items theo số questions', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(
        COMPLETED_SESSION,
      );
      mockPrisma.sessionQuestion.findMany.mockResolvedValue([
        {
          id: 'q-1',
          questionText: 'Tell me about yourself',
          orderIndex: 1,
          userAnswers: [],
        },
        {
          id: 'q-2',
          questionText: 'Your strengths?',
          orderIndex: 2,
          userAnswers: [],
        },
      ]);

      const result = await service.getReport('session-123', 'user-abc');
      expect(result.transcript).toHaveLength(2);
      expect(result.transcript[0].questionText).toBe('Tell me about yourself');
    });

    it('trả score=null thay vì 0 khi toàn bộ feedback là fallback', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...COMPLETED_SESSION,
        overallScore: 0,
        actionPlanJson: {},
      });
      mockPrisma.sessionQuestion.findMany.mockResolvedValue([
        {
          id: 'q-1',
          questionText: 'Tell me about yourself',
          orderIndex: 1,
          userAnswers: [
            {
              answerText: 'I am a developer.',
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

      expect(result.overallScore).toBeNull();
      expect(result.transcript[0].overallScore).toBeNull();
      expect(result.transcript[0].isFallback).toBe(true);
      expect(result.executiveSummary.overallScore).toBeNull();
      expect(result.actionPlan.items).toHaveLength(3);
    });
  });

  describe('enqueueReport', () => {
    it('gọi reportQueue.add với đúng job name và params', async () => {
      mockPrisma.userAnswer.findMany.mockResolvedValue([
        { id: 'ans-1' },
        { id: 'ans-2' },
      ]);
      mockReportQueue.add.mockResolvedValue({});

      await service.enqueueReport('session-123', 'hr', 'VN');

      expect(mockReportQueue.add).toHaveBeenCalledWith(
        'comprehensive-report',
        {
          sessionId: 'session-123',
          sessionType: 'hr',
          contextPack: 'VN',
          turnIds: ['ans-1', 'ans-2'],
        },
        expect.objectContaining({ jobId: 'report-session-123' }),
      );
    });

    it('không tạo job mới khi job report của session đã tồn tại', async () => {
      const existingJob = {
        getState: jest.fn().mockResolvedValue('waiting'),
        retry: jest.fn(),
      };
      mockPrisma.userAnswer.findMany.mockResolvedValue([{ id: 'ans-1' }]);
      mockReportQueue.getJob.mockResolvedValue(existingJob);

      await service.enqueueReport('session-123', 'hr', 'VN');

      expect(mockReportQueue.add).not.toHaveBeenCalled();
      expect(existingJob.retry).not.toHaveBeenCalled();
    });

    it('từ chối enqueue report khi session chưa có answer', async () => {
      mockPrisma.userAnswer.findMany.mockResolvedValue([]);

      await expect(
        service.enqueueReport('session-123', 'hr', 'VN'),
      ).rejects.toMatchObject({ errorCode: ErrorCode.SESSION_INCOMPLETE });
    });
  });
});
