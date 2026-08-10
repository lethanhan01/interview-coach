import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ReportService } from './report.service';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import {
  REPORT_JOB_ATTEMPTS,
  REPORT_JOB_RETRY_DELAY_MS,
  REPORT_QUEUE,
} from '../common/constants/queue.constants';
import {
  createMockPrismaService,
  createMockQueue,
} from '../test-utils/mock-factories';

const COMPLETED_SESSION = {
  id: 'session-123',
  overallScore: 75,
  status: 'completed',
  savedJobDescription: {
    userId: 'user-abc',
  },
  sessionReports: [
    {
      reportType: 'executive_summary',
      version: 1,
      contentJson: { summary: 'Good performance' },
    },
    {
      reportType: 'competency_heatmap',
      version: 1,
      contentJson: { clarity: 80 },
    },
    { reportType: 'action_plan', version: 1, contentJson: { actions: [] } },
    { reportType: 'comm_analysis', version: 1, contentJson: {} },
  ],
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

    it('throw REPORT_NOT_READY (202) khi chưa có executive_summary report', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...COMPLETED_SESSION,
        sessionReports: [],
      });

      await expect(
        service.getReport('session-123', 'user-abc'),
      ).rejects.toThrow(InterviewAIException);

      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...COMPLETED_SESSION,
        sessionReports: [],
      });
      try {
        await service.getReport('session-123', 'user-abc');
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(
          ErrorCode.REPORT_NOT_READY,
        );
        expect((e as InterviewAIException).getStatus()).toBe(
          HttpStatus.ACCEPTED,
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

    it('chuẩn hóa các JSON object phụ bị null thành object rỗng khi thiếu rows', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...COMPLETED_SESSION,
        sessionReports: [
          {
            reportType: 'executive_summary',
            version: 1,
            contentJson: { summary: 'Good performance' },
          },
        ],
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

    it('trả về reportQuality=full khi không có fallback feedbacks', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(
        COMPLETED_SESSION,
      );
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
      mockPrisma.interviewSession.findUnique.mockResolvedValue(
        COMPLETED_SESSION,
      );
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
      mockPrisma.interviewSession.findUnique.mockResolvedValue(
        COMPLETED_SESSION,
      );
      mockPrisma.sessionQuestion.findMany.mockResolvedValue([
        {
          id: 'q-1',
          questionText: 'Q1',
          orderIndex: 1,
          userAnswers: [
            {
              answerText: 'A1',
              aiFeedback: {
                overallScore: 80,
                modelAnswer: 'M',
                keyTakeaway: 'K',
                isFallback: false,
                annotatedSegments: [],
              },
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

      expect(result.reportQuality).toBe('partial');
    });

    it('trả score=null thay vì 0 khi toàn bộ feedback là fallback', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...COMPLETED_SESSION,
        overallScore: 0,
        sessionReports: [
          {
            reportType: 'executive_summary',
            version: 1,
            contentJson: { summary: 'Good performance' },
          },
          { reportType: 'action_plan', version: 1, contentJson: {} },
        ],
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

    it('trả score=0 và modelAnswer cho phiên chỉ có câu skipped đã được hệ thống chấm', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...COMPLETED_SESSION,
        overallScore: 0,
        sessionReports: [
          {
            reportType: 'executive_summary',
            version: 1,
            contentJson: { summary: 'Skipped session', overallScore: 0 },
          },
          {
            reportType: 'skipped_answers',
            version: 1,
            contentJson: {
              answers: [
                {
                  answerId: 'answer-skip-1',
                  modelAnswer: 'Câu trả lời đề xuất cho câu bị bỏ qua.',
                },
              ],
            },
          },
        ],
      });
      mockPrisma.sessionQuestion.findMany.mockResolvedValue([
        {
          id: 'q-1',
          questionText: 'Question 1',
          orderIndex: 1,
          userAnswers: [
            {
              id: 'answer-skip-1',
              answerText: '',
              skipped: true,
              aiFeedback: {
                overallScore: 0,
                modelAnswer: '',
                keyTakeaway: 'Skipped question',
                isFallback: false,
                annotatedSegments: [],
                dimensionScores: [
                  {
                    id: 'D1',
                    name: 'Communication',
                    score: 0,
                    weight: 1,
                  },
                ],
              },
            },
          ],
        },
      ]);

      const result = await service.getReport('session-123', 'user-abc');

      expect(result.reportQuality).toBe('full');
      expect(result.overallScore).toBe(0);
      expect(result.transcript[0]).toEqual(
        expect.objectContaining({
          skipped: true,
          answerText: '',
          overallScore: 0,
          modelAnswer: 'Câu trả lời đề xuất cho câu bị bỏ qua.',
          keyTakeaway: '',
          segments: [],
          appliedDimensions: [
            { id: 'D1', name: 'Communication', score: 0, weight: 1 },
          ],
        }),
      );
    });

    it('appliedDimensions: có giá trị ở câu thường và skip, undefined ở fallback', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(
        COMPLETED_SESSION,
      );
      mockPrisma.sessionQuestion.findMany.mockResolvedValue([
        {
          id: 'q-1',
          questionText: 'Normal Q',
          orderIndex: 1,
          userAnswers: [
            {
              id: 'a-1',
              answerText: 'Good answer',
              skipped: false,
              aiFeedback: {
                overallScore: 80,
                modelAnswer: 'Model',
                keyTakeaway: 'Key',
                isFallback: false,
                annotatedSegments: [],
                dimensionScores: [
                  { id: 'TD1', name: 'Fundamentals', score: 90, weight: 0.6 },
                  { id: 'TD2', name: 'Application', score: 70, weight: 0.4 },
                ],
              },
            },
          ],
        },
        {
          id: 'q-2',
          questionText: 'Fallback Q',
          orderIndex: 2,
          userAnswers: [
            {
              id: 'a-2',
              answerText: 'Bad connection',
              skipped: false,
              aiFeedback: {
                overallScore: 0,
                modelAnswer: '',
                keyTakeaway: 'AI unavailable',
                isFallback: true,
                annotatedSegments: [],
                dimensionScores: null,
              },
            },
          ],
        },
        {
          id: 'q-3',
          questionText: 'Skip Q',
          orderIndex: 3,
          userAnswers: [
            {
              id: 'a-3',
              answerText: '',
              skipped: true,
              aiFeedback: {
                overallScore: 0,
                modelAnswer: '',
                keyTakeaway: 'Skipped question',
                isFallback: false,
                annotatedSegments: [],
                dimensionScores: [
                  { id: 'D1', name: 'Communication', score: 0, weight: 1 },
                ],
              },
            },
          ],
        },
      ]);

      const result = await service.getReport('session-123', 'user-abc');
      const normalItem = result.transcript[0];
      const fallbackItem = result.transcript[1];
      const skippedItem = result.transcript[2];

      expect(normalItem.appliedDimensions).toEqual([
        { id: 'TD1', name: 'Fundamentals', score: 90, weight: 0.6 },
        { id: 'TD2', name: 'Application', score: 70, weight: 0.4 },
      ]);
      expect(fallbackItem.appliedDimensions).toBeUndefined();
      expect(skippedItem.appliedDimensions).toEqual([
        { id: 'D1', name: 'Communication', score: 0, weight: 1 },
      ]);
    });

    it('không trả annotated segment nếu segmentText không thuộc answerText', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(
        COMPLETED_SESSION,
      );
      mockPrisma.sessionQuestion.findMany.mockResolvedValue([
        {
          id: 'q-rest',
          questionText: 'REST là gì?',
          orderIndex: 1,
          userAnswers: [
            {
              id: '8abade13-5a8f-414c-ad07-7878ed94b01d',
              answerText: 'Tôi nghĩ REST là nghỉ ngơi.',
              skipped: false,
              aiFeedback: {
                overallScore: 15,
                modelAnswer: 'REST là một kiến trúc phong cách.',
                keyTakeaway: 'Cần phân biệt nghĩa kỹ thuật.',
                isFallback: false,
                annotatedSegments: [
                  {
                    id: 'seg-from-model-answer',
                    segmentText: 'REST là một kiến trúc phong cách.',
                    startIndex: 0,
                    endIndex: 34,
                    highlightLevel: 'strength',
                    annotation: 'Định nghĩa đúng.',
                    suggestion: null,
                  },
                ],
                dimensionScores: [
                  { id: 'TD1', name: 'Fundamentals', score: 15, weight: 1 },
                ],
              },
            },
          ],
        },
      ]);

      const result = await service.getReport('session-123', 'user-abc');

      expect(result.transcript[0]).toEqual(
        expect.objectContaining({
          answerId: '8abade13-5a8f-414c-ad07-7878ed94b01d',
          segments: [],
        }),
      );
    });
  });

  describe('getFeedbackProgress', () => {
    it('tính progress đúng và không tính skipped answers vào feedbackRequired', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        id: 'session-123',
        savedJobDescription: { userId: 'user-abc' },
        status: 'completing',
        sessionReports: [],
      });
      mockPrisma.sessionQuestion.count.mockResolvedValue(5);
      mockPrisma.userAnswer.count
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2);

      const result = await service.getFeedbackProgress(
        'session-123',
        'user-abc',
      );

      expect(result).toEqual({
        sessionId: 'session-123',
        status: 'completing',
        totalQuestions: 5,
        answeredQuestions: 4,
        skippedQuestions: 1,
        feedbackRequired: 3,
        feedbackCompleted: 2,
        feedbackPending: 1,
        reportReady: false,
      });
    });

    it('trả pending = 0 khi tất cả câu đã trả lời đều skipped', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        id: 'session-123',
        savedJobDescription: { userId: 'user-abc' },
        status: 'completing',
        sessionReports: [],
      });
      mockPrisma.sessionQuestion.count.mockResolvedValue(3);
      mockPrisma.userAnswer.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(0);

      const result = await service.getFeedbackProgress(
        'session-123',
        'user-abc',
      );

      expect(result.feedbackRequired).toBe(0);
      expect(result.feedbackCompleted).toBe(0);
      expect(result.feedbackPending).toBe(0);
    });

    it('reportReady=true khi session completed và đã có executive_summary', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        id: 'session-123',
        savedJobDescription: { userId: 'user-abc' },
        status: 'completed',
        sessionReports: [{ id: 'report-1' }],
      });
      mockPrisma.sessionQuestion.count.mockResolvedValue(1);
      mockPrisma.userAnswer.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(1);

      const result = await service.getFeedbackProgress(
        'session-123',
        'user-abc',
      );

      expect(result.reportReady).toBe(true);
    });

    it('throw FORBIDDEN khi user không phải chủ sở hữu', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        id: 'session-123',
        savedJobDescription: {
          userId: 'user-abc',
        },
        status: 'completing',
        sessionReports: [],
      });

      await expect(
        service.getFeedbackProgress('session-123', 'other-user'),
      ).rejects.toMatchObject({ errorCode: ErrorCode.FORBIDDEN });
      expect(mockPrisma.sessionQuestion.count).not.toHaveBeenCalled();
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
          language: 'vi',
          turnIds: ['ans-1', 'ans-2'],
        },
        expect.objectContaining({ jobId: 'report-session-123' }),
      );
      expect(mockReportQueue.add).toHaveBeenCalledWith(
        'comprehensive-report',
        expect.any(Object),
        expect.objectContaining({
          attempts: REPORT_JOB_ATTEMPTS,
          backoff: { type: 'fixed', delay: REPORT_JOB_RETRY_DELAY_MS },
        }),
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

    it('retry job report đã failed thay vì tạo job trùng', async () => {
      const existingJob = {
        getState: jest.fn().mockResolvedValue('failed'),
        retry: jest.fn().mockResolvedValue(undefined),
      };
      mockPrisma.userAnswer.findMany.mockResolvedValue([{ id: 'ans-1' }]);
      mockReportQueue.getJob.mockResolvedValue(existingJob);

      await service.enqueueReport('session-123', 'mixed', 'Western');

      expect(existingJob.retry).toHaveBeenCalledTimes(1);
      expect(mockReportQueue.add).not.toHaveBeenCalled();
    });

    it('đưa language=en vào report job khi được truyền', async () => {
      mockPrisma.userAnswer.findMany.mockResolvedValue([{ id: 'ans-1' }]);
      mockReportQueue.add.mockResolvedValue({});

      await service.enqueueReport('session-123', 'hr', 'Western', 'en');

      expect(mockReportQueue.add).toHaveBeenCalledWith(
        'comprehensive-report',
        expect.objectContaining({ language: 'en' }),
        expect.objectContaining({ jobId: 'report-session-123' }),
      );
    });

    it('từ chối enqueue report khi session chưa có answer', async () => {
      mockPrisma.userAnswer.findMany.mockResolvedValue([]);

      await expect(
        service.enqueueReport('session-123', 'hr', 'VN'),
      ).rejects.toMatchObject({ errorCode: ErrorCode.SESSION_INCOMPLETE });
    });
  });

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
        .mockResolvedValueOnce(3) // total
        .mockResolvedValueOnce(2); // pending non-skipped feedbacks

      await service.enqueueIfAllFeedbacksReady('session-123', 'hr', 'VN');

      expect(mockReportQueue.add).not.toHaveBeenCalled();
    });

    it('không enqueue khi session completing nhưng chưa có answer nào', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...COMPLETED_SESSION,
        status: 'completing',
      });
      mockPrisma.userAnswer.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await service.enqueueIfAllFeedbacksReady('session-123', 'hr', 'VN');

      expect(mockPrisma.userAnswer.findMany).not.toHaveBeenCalled();
      expect(mockReportQueue.add).not.toHaveBeenCalled();
    });

    it('enqueue report khi tất cả feedbacks đã xong và status là completing', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...COMPLETED_SESSION,
        status: 'completing',
      });
      mockPrisma.userAnswer.count
        .mockResolvedValueOnce(3) // total
        .mockResolvedValueOnce(0); // pending non-skipped feedbacks
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
        expect.objectContaining({ sessionId: 'session-123', language: 'vi' }),
        expect.objectContaining({ jobId: 'report-session-123' }),
      );
    });

    it('enqueue khi chỉ còn câu skipped chưa có feedback', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue({
        ...COMPLETED_SESSION,
        status: 'completing',
      });
      mockPrisma.userAnswer.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(0);
      mockPrisma.userAnswer.findMany.mockResolvedValue([
        { id: 'answered-1' },
        { id: 'skipped-1' },
        { id: 'skipped-2' },
      ]);
      mockReportQueue.getJob.mockResolvedValue(null);
      mockReportQueue.add.mockResolvedValue({} as any);

      await service.enqueueIfAllFeedbacksReady('session-123', 'hr', 'VN');

      expect(mockReportQueue.add).toHaveBeenCalledWith(
        'comprehensive-report',
        expect.objectContaining({
          turnIds: ['answered-1', 'skipped-1', 'skipped-2'],
        }),
        expect.objectContaining({ jobId: 'report-session-123' }),
      );
    });

    it('không enqueue khi session không tồn tại', async () => {
      mockPrisma.interviewSession.findUnique.mockResolvedValue(null);

      await service.enqueueIfAllFeedbacksReady('session-123', 'hr', 'VN');

      expect(mockReportQueue.add).not.toHaveBeenCalled();
    });
  });
});
