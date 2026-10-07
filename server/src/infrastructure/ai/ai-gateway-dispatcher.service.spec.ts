import { ConfigService } from '@nestjs/config';
import { AIGatewayDispatcher } from './ai-gateway-dispatcher.service';
import { OpenAIGateway } from './openai.gateway';
import { PythonAiClient } from './clients/python-ai.client';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';

describe('AIGatewayDispatcher', () => {
  let dispatcher: AIGatewayDispatcher;
  let configService: jest.Mocked<ConfigService>;
  let openAiGateway: jest.Mocked<OpenAIGateway>;
  let pythonAiClient: jest.Mocked<PythonAiClient>;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'AI_STT_PROVIDER') return 'python';
        if (key === 'AI_TTS_PROVIDER') return 'python';
        if (key === 'AI_FALLBACK_ENABLED') return 'true';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    openAiGateway = {
      chatCompletion: jest.fn(),
      generateStructured: jest.fn(),
      generateText: jest.fn(),
      getChatModel: jest.fn(),
      transcribe: jest.fn(),
      transcribeAudio: jest.fn(),
      transcribeWithMetrics: jest.fn(),
      synthesizeSpeech: jest.fn(),
    } as unknown as jest.Mocked<OpenAIGateway>;

    pythonAiClient = {
      transcribe: jest.fn(),
      synthesizeSpeech: jest.fn(),
    } as unknown as jest.Mocked<PythonAiClient>;

    dispatcher = new AIGatewayDispatcher(
      configService,
      openAiGateway,
      pythonAiClient,
    );
  });

  describe('transcribeWithMetrics', () => {
    it('uses Python client when AI_STT_PROVIDER=python', async () => {
      const mockResult = {
        text: 'Python STT result',
        language: 'en',
        durationSeconds: 2.0,
        metrics: {
          wpm: 140,
          fillerWordCount: 0,
          fillerWords: [],
          pauseCount: 0,
          totalPauseDurationSeconds: 0,
          speechDurationSeconds: 2.0,
          confidenceScore: 0.98,
        },
      };

      pythonAiClient.transcribe.mockResolvedValue(mockResult);

      const result = await dispatcher.transcribeWithMetrics({
        audioBuffer: Buffer.from('test'),
      });

      expect(pythonAiClient.transcribe).toHaveBeenCalled();
      expect(openAiGateway.transcribeWithMetrics).not.toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('falls back to OpenAI when Python STT fails and fallback is enabled', async () => {
      pythonAiClient.transcribe.mockRejectedValue(new Error('Connection error'));

      const fallbackResult = {
        text: 'OpenAI fallback result',
        language: 'en',
        durationSeconds: 2.0,
        metrics: {
          wpm: 120,
          fillerWordCount: 0,
          fillerWords: [],
          pauseCount: 0,
          totalPauseDurationSeconds: 0,
          speechDurationSeconds: 2.0,
          confidenceScore: 0.9,
        },
      };

      openAiGateway.transcribeWithMetrics.mockResolvedValue(fallbackResult);

      const result = await dispatcher.transcribeWithMetrics({
        audioBuffer: Buffer.from('test'),
      });

      expect(pythonAiClient.transcribe).toHaveBeenCalled();
      expect(openAiGateway.transcribeWithMetrics).toHaveBeenCalled();
      expect(result).toEqual(fallbackResult);
    });

    it('does NOT fall back to OpenAI when Python STT fails with 4xx client error (NO_SPEECH_DETECTED)', async () => {
      const clientError = new InterviewAIException(
        ErrorCode.NO_SPEECH_DETECTED,
        400,
        'Không phát hiện thấy âm thanh giọng nói rõ ràng.',
      );
      pythonAiClient.transcribe.mockRejectedValue(clientError);

      await expect(
        dispatcher.transcribeWithMetrics({ audioBuffer: Buffer.from('test') }),
      ).rejects.toThrow(clientError);

      expect(pythonAiClient.transcribe).toHaveBeenCalled();
      expect(openAiGateway.transcribeWithMetrics).not.toHaveBeenCalled();
    });

    it('skips fallback and throws Python error directly when OPENAI_BASE_URL points to LM Studio on port 1234 without WHISPER_BASE_URL', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'AI_STT_PROVIDER') return 'python';
        if (key === 'AI_FALLBACK_ENABLED') return 'true';
        if (key === 'OPENAI_BASE_URL') return 'http://127.0.0.1:1234/v1';
        if (key === 'OPENAI_API_KEY') return 'lm-studio';
        return undefined;
      });

      const serverError = new InterviewAIException(
        ErrorCode.AI_SERVICE_UNAVAILABLE,
        502,
        'AI speech service unreachable: Connection error',
      );
      pythonAiClient.transcribe.mockRejectedValue(serverError);

      await expect(
        dispatcher.transcribeWithMetrics({ audioBuffer: Buffer.from('test') }),
      ).rejects.toThrow(serverError);

      expect(pythonAiClient.transcribe).toHaveBeenCalled();
      expect(openAiGateway.transcribeWithMetrics).not.toHaveBeenCalled();
    });

    it('skips fallback when AI_FALLBACK_ENABLED=false', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'AI_STT_PROVIDER') return 'python';
        if (key === 'AI_FALLBACK_ENABLED') return 'false';
        return undefined;
      });

      const serverError = new Error('Service down');
      pythonAiClient.transcribe.mockRejectedValue(serverError);

      await expect(
        dispatcher.transcribeWithMetrics({ audioBuffer: Buffer.from('test') }),
      ).rejects.toThrow(serverError);

      expect(openAiGateway.transcribeWithMetrics).not.toHaveBeenCalled();
    });

    it('throws if AI_STT_PROVIDER=disabled', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'AI_STT_PROVIDER') return 'disabled';
        return undefined;
      });

      await expect(
        dispatcher.transcribeWithMetrics({ audioBuffer: Buffer.from('test') }),
      ).rejects.toThrow(InterviewAIException);
    });
  });

  describe('synthesizeSpeech', () => {
    it('routes to pythonAiClient when AI_TTS_PROVIDER=python', async () => {
      const mockResult = {
        stream: {} as any,
        contentType: 'audio/wav',
      };
      pythonAiClient.synthesizeSpeech.mockResolvedValue(mockResult);

      const result = await dispatcher.synthesizeSpeech({ text: 'Hello' });

      expect(pythonAiClient.synthesizeSpeech).toHaveBeenCalledWith({
        text: 'Hello',
      });
      expect(result).toEqual(mockResult);
    });

    it('throws if AI_TTS_PROVIDER=disabled', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'AI_TTS_PROVIDER') return 'disabled';
        return undefined;
      });

      await expect(
        dispatcher.synthesizeSpeech({ text: 'Hello' }),
      ).rejects.toThrow(InterviewAIException);
    });
  });
});
