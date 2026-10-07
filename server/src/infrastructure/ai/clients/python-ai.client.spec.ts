import { ConfigService } from '@nestjs/config';
import { PythonAiClient } from './python-ai.client';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';

describe('PythonAiClient', () => {
  let client: PythonAiClient;
  let configService: jest.Mocked<ConfigService>;
  const originalFetch = global.fetch;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'AI_SERVICE_URL') return 'http://localhost:8000';
        if (key === 'INTERNAL_AI_SECRET') return 'test-secret';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    client = new PythonAiClient(configService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('transcribe', () => {
    it('sends multipart request with auth header and returns parsed response', async () => {
      const mockResult = {
        text: 'Hello world',
        language: 'en',
        durationSeconds: 1.5,
        metrics: {
          wpm: 120,
          fillerWordCount: 0,
          fillerWords: [],
          pauseCount: 0,
          totalPauseDurationSeconds: 0,
          speechDurationSeconds: 1.5,
          confidenceScore: 0.95,
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResult,
      } as any);

      const result = await client.transcribe({
        audioBuffer: Buffer.from('audio-bytes'),
        mimeType: 'audio/webm',
        language: 'en',
      });

      expect(global.fetch).toHaveBeenCalled();
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe('http://localhost:8000/api/v1/stt/transcribe');
      expect(options.method).toBe('POST');
      expect(options.headers['x-internal-secret']).toBe('test-secret');
      expect(result).toEqual(mockResult);
    });

    it('throws InterviewAIException when response is not ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 413,
        json: async () => ({
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'Audio exceeds 25MB limit',
          },
        }),
      } as any);

      await expect(
        client.transcribe({
          audioBuffer: Buffer.from('large-bytes'),
          mimeType: 'audio/webm',
        }),
      ).rejects.toThrow(InterviewAIException);

      await expect(
        client.transcribe({
          audioBuffer: Buffer.from('large-bytes'),
          mimeType: 'audio/webm',
        }),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.PAYLOAD_TOO_LARGE,
      });
    });

    it('parses NO_SPEECH_DETECTED error from Python AI Service with status 400', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          errorCode: 'NO_SPEECH_DETECTED',
          message: 'Không phát hiện thấy âm thanh giọng nói rõ ràng trong bản ghi.',
          details: {},
        }),
      } as any);

      await expect(
        client.transcribe({
          audioBuffer: Buffer.from('silent-bytes'),
          mimeType: 'audio/webm',
        }),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.NO_SPEECH_DETECTED,
        status: 400,
        message: 'Không phát hiện thấy âm thanh giọng nói rõ ràng trong bản ghi.',
      });
    });

    it('handles request timeout by throwing AI_TIMEOUT with 504 status', async () => {
      const abortError = new Error('The operation was aborted due to timeout');
      abortError.name = 'TimeoutError';
      global.fetch = jest.fn().mockRejectedValue(abortError);

      await expect(
        client.transcribe({
          audioBuffer: Buffer.from('audio-bytes'),
          mimeType: 'audio/webm',
        }),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.AI_TIMEOUT,
        status: 504,
      });
    });
  });

  describe('synthesizeSpeech', () => {
    it('sends json request and returns readable stream', async () => {
      const mockBody = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        body: mockBody,
        headers: new Headers({ 'content-type': 'audio/wav' }),
      } as any);

      const result = await client.synthesizeSpeech({
        text: 'Test question',
        language: 'en',
      });

      expect(result.contentType).toBe('audio/wav');
      expect(result.stream).toBeDefined();
    });
  });
});
