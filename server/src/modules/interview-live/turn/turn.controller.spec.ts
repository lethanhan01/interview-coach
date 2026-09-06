import { Test, TestingModule } from '@nestjs/testing';
import { TurnController } from './turn.controller';
import { TurnService } from './turn.service';
import { JwtAuthGuard } from '@core/common/guards';
import { createMockTurnService } from '@core/test-utils/mock-factories';

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

  describe('POST /sessions/:sessionId/turns/audio', () => {
    it('gọi turnService.uploadAudio với sessionId, userId, file và trả về URL', async () => {
      const file = {
        buffer: Buffer.from([1, 2, 3]),
        mimetype: 'audio/webm',
        size: 3,
      };
      const uploadResult = {
        audioFileUrl:
          'https://project.supabase.co/storage/v1/object/public/interview-audio/u/s/audio.webm',
        audioSizeBytes: 3,
        transcript: 'Tôi là backend developer.',
        transcriptDurationSeconds: 2,
      };
      mockTurnService.uploadAudio.mockResolvedValue(uploadResult);

      const result = await controller.uploadAudio(
        'session-123',
        file,
        mockReq(),
      );

      expect(result).toEqual(uploadResult);
      expect(mockTurnService.uploadAudio).toHaveBeenCalledWith(
        'session-123',
        'user-abc',
        file,
      );
    });
  });

  describe('POST /sessions/:sessionId/turns', () => {
    it('gọi turnService.submitAnswer với sessionId, userId, dto và trả về kết quả', async () => {
      const dto = {
        questionId: 'q-1',
        answerMode: 'text',
        answerText: 'Tôi là backend developer.',
      } as any;
      const turnResult = {
        answerId: 'answer-1',
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
