import { Test, TestingModule } from '@nestjs/testing';
import { TurnController } from './turn.controller';
import { TurnService } from './turn.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { createMockTurnService } from '../test-utils/mock-factories';

describe('TurnController', () => {
  let controller: TurnController;
  let mockTurnService: ReturnType<typeof createMockTurnService>;

  const mockReq = (userId = 'user-abc') =>
    ({ user: { id: userId, email: 'a@b.com' } }) as any;

  beforeEach(async () => {
    mockTurnService = createMockTurnService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TurnController],
      providers: [{ provide: TurnService, useValue: mockTurnService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TurnController>(TurnController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /sessions/:sessionId/turns', () => {
    it('gọi turnService.submitAnswer với sessionId, userId, dto và trả về kết quả', async () => {
      const dto = {
        questionId: 'q-1',
        answerMode: 'text',
        answerText: 'Tôi là backend developer.',
      } as any;
      const turnResult = {
        answerId: 'answer-1',
        followUpQueued: false,
        feedbackQueued: true,
      };
      mockTurnService.submitAnswer.mockResolvedValue(turnResult);

      const result = await controller.submitAnswer(
        'session-123',
        dto,
        mockReq(),
      );

      expect(result).toEqual(turnResult);
      expect(mockTurnService.submitAnswer).toHaveBeenCalledWith(
        'session-123',
        'user-abc',
        dto,
      );
    });

    it('propagate exception khi turnService.submitAnswer ném lỗi', async () => {
      mockTurnService.submitAnswer.mockRejectedValue(
        new Error('Session not found'),
      );
      const dto = {
        questionId: 'q-1',
        answerMode: 'text',
        answerText: 'text',
      } as any;

      await expect(
        controller.submitAnswer('session-123', dto, mockReq()),
      ).rejects.toThrow('Session not found');
    });
  });
});
