import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { SseService } from '@infra/realtime/redis/sse.service';
import { ReportService } from '../../../report/report.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { SseTokenGuard } from '../../../auth/guards/sse-token.guard';
import {
  createMockReportService,
  createMockSessionService,
  createMockSseService,
} from '@core/test-utils/mock-factories';

describe('SessionController', () => {
  let controller: SessionController;
  let mockSessionService: ReturnType<typeof createMockSessionService>;
  let mockReportService: ReturnType<typeof createMockReportService>;
  let mockSseService: ReturnType<typeof createMockSseService>;

  const mockReq = (userId = 'user-abc') => ({ user: { id: userId } }) as any;

  beforeEach(async () => {
    mockSessionService = createMockSessionService();
    mockReportService = createMockReportService();
    mockSseService = createMockSseService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        { provide: ReportService, useValue: mockReportService },
        { provide: SseService, useValue: mockSseService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SseTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SessionController>(SessionController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /sessions', () => {
    it('gọi sessionService.create với userId và dto, trả về session', async () => {
      const dto = { jobDescription: 'jd', sessionType: 'hr' } as any;
      const created = { id: 'session-1', status: 'generating' };
      mockSessionService.create.mockResolvedValue(created);

      const result = await controller.create(dto, mockReq());

      expect(result).toEqual(created);
      expect(mockSessionService.create).toHaveBeenCalledWith('user-abc', dto);
    });
  });

  describe('GET /sessions', () => {
    it('trả về { sessions: [...] } với danh sách của user', async () => {
      const sessions = [{ id: 's1' }, { id: 's2' }];
      mockSessionService.findAll.mockResolvedValue(sessions);

      const result = await controller.findAll(mockReq());

      expect(result).toEqual({ sessions });
      expect(mockSessionService.findAll).toHaveBeenCalledWith(
        'user-abc',
        undefined,
      );
    });
  });

  describe('GET /sessions/:id', () => {
    it('trả về session khi tìm thấy', async () => {
      const session = { id: 'session-1', status: 'active' };
      mockSessionService.findById.mockResolvedValue(session);

      const result = await controller.findOne('session-1', mockReq());

      expect(result).toEqual(session);
      expect(mockSessionService.findById).toHaveBeenCalledWith(
        'session-1',
        'user-abc',
        undefined,
      );
    });
  });

  describe('GET /sessions/:id/status', () => {
    it('trả về { status, numQuestions } từ session', async () => {
      mockSessionService.findById.mockResolvedValue({
        id: 'session-1',
        status: 'active',
        numQuestions: 5,
      });

      const result = await controller.getStatus('session-1', mockReq());

      expect(result).toEqual({ status: 'active', numQuestions: 5 });
    });
  });

  describe('GET /sessions/:id/questions', () => {
    it('trả về questions kèm currentIndex từ service', async () => {
      const questions = [{ id: 'q-1', content: 'Giới thiệu?', orderIndex: 1 }];
      const response = { questions, currentIndex: 0 };
      mockSessionService.findQuestions.mockResolvedValue(response);

      const result = await controller.findQuestions('session-1', mockReq());

      expect(result).toEqual(response);
      expect(mockSessionService.findQuestions).toHaveBeenCalledWith(
        'session-1',
        'user-abc',
      );
    });
  });

  describe('GET /sessions/:id/feedback-progress', () => {
    it('trả về progress và kiểm ownership qua userId', async () => {
      const progress = {
        sessionId: 'session-1',
        status: 'completing',
        totalQuestions: 5,
        answeredQuestions: 5,
        skippedQuestions: 1,
        feedbackRequired: 4,
        feedbackCompleted: 2,
        feedbackPending: 2,
        reportReady: false,
      };
      mockReportService.getFeedbackProgress.mockResolvedValue(progress);

      const result = await controller.getFeedbackProgress(
        'session-1',
        mockReq(),
      );

      expect(result).toEqual(progress);
      expect(mockReportService.getFeedbackProgress).toHaveBeenCalledWith(
        'session-1',
        'user-abc',
      );
    });
  });

  describe('PATCH /sessions/:id/status', () => {
    it('gọi sessionService.updateStatus với đúng params', async () => {
      const updated = { id: 'session-1', status: 'completed' };
      mockSessionService.updateStatus.mockResolvedValue(updated);
      const dto = {
        status: 'completed',
        remainingSeconds: 0,
        autoSkipUnanswered: true,
      } as any;

      const result = await controller.updateStatus('session-1', dto, mockReq());

      expect(result).toEqual(updated);
      expect(mockSessionService.updateStatus).toHaveBeenCalledWith(
        'session-1',
        'user-abc',
        'completed',
        0,
        true,
      );
    });
  });

  describe('SSE /sessions/:id/events', () => {
    it('xác thực ownership trước khi subscribe vào đúng session channel', async () => {
      const observable = of({ data: 'event' });
      mockSseService.subscribe.mockReturnValue(observable);

      const result = await controller.streamEvents('session-1', mockReq());

      expect(result).toBe(observable);
      expect(mockSessionService.findById).toHaveBeenCalledWith(
        'session-1',
        'user-abc',
      );
      expect(mockSseService.subscribe).toHaveBeenCalledWith(
        'sse:session:session-1',
      );
    });

    it('không subscribe khi session không thuộc user', async () => {
      mockSessionService.findById.mockRejectedValue(new Error('FORBIDDEN'));

      await expect(
        controller.streamEvents('session-1', mockReq('other-user')),
      ).rejects.toThrow('FORBIDDEN');
      expect(mockSseService.subscribe).not.toHaveBeenCalled();
    });
  });
});
