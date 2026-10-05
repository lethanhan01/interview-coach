import { ConfigService } from '@nestjs/config';
import { SpeechToText } from './speech-to-text.service';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import {
  createMockConfigService,
  createMockOpenAIGateway,
} from '@core/test-utils/mock-factories';
import { LocalDiskMediaStorageAdapter } from '@infra/storage/local-disk-media-storage.adapter';

describe('SpeechToText', () => {
  const originalFetch = global.fetch;
  let service: SpeechToText;
  let mockOpenAI: ReturnType<typeof createMockOpenAIGateway>;
  let mockStorageAdapter: jest.Mocked<LocalDiskMediaStorageAdapter>;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockOpenAI = createMockOpenAIGateway();
    mockStorageAdapter = {
      readBuffer: jest.fn(),
    } as unknown as jest.Mocked<LocalDiskMediaStorageAdapter>;

    const config = createMockConfigService({
      APP_URL: 'https://project.example.com',
      AUDIO_ALLOWED_HOSTS: '',
      NODE_ENV: 'production',
    });
    service = new SpeechToText(
      mockOpenAI,
      config as unknown as ConfigService,
      mockStorageAdapter,
    );
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('đọc trực tiếp từ LocalDiskMediaStorageAdapter nếu URL là stream link nội bộ', async () => {
    mockStorageAdapter.readBuffer.mockResolvedValue(Buffer.from([10, 20, 30]));
    mockOpenAI.transcribe.mockResolvedValue({
      text: 'Đọc file trực tiếp từ disk',
      durationSeconds: 3,
    });

    const localUrl =
      'https://project.example.com/media/audio/stream?key=user-1/audio.webm&expires=1780000000&token=abc';
    const result = await service.transcribe(localUrl);

    expect(result).toEqual({
      text: 'Đọc file trực tiếp từ disk',
      durationSeconds: 3,
    });
    expect(mockStorageAdapter.readBuffer).toHaveBeenCalledWith(
      'user-1/audio.webm',
    );
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockOpenAI.transcribe).toHaveBeenCalledWith(
      expect.objectContaining({
        audioBuffer: Buffer.from([10, 20, 30]),
        mimeType: 'audio/webm',
      }),
    );
  });

  it('từ chối URL không dùng HTTPS (trong production) hoặc không thuộc allowlist', async () => {
    await expect(
      service.transcribe('http://project.example.com/audio.webm'),
    ).rejects.toMatchObject({ errorCode: ErrorCode.INVALID_AUDIO_URL });
    await expect(
      service.transcribe('https://attacker.example/audio.webm'),
    ).rejects.toMatchObject({ errorCode: ErrorCode.INVALID_AUDIO_URL });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('kiểm tra response.ok trước khi đọc body', async () => {
    fetchMock.mockResolvedValue(new Response('not found', { status: 404 }));

    await expect(
      service.transcribe('https://project.example.com/audio.webm'),
    ).rejects.toMatchObject({ errorCode: ErrorCode.AUDIO_DOWNLOAD_FAILED });
    expect(mockOpenAI.transcribe).not.toHaveBeenCalled();
  });

  it('dừng stream khi dữ liệu vượt quá 10 MB dù thiếu content-length', async () => {
    const oversizedChunk = new Uint8Array(10 * 1024 * 1024 + 1);
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(oversizedChunk);
        controller.close();
      },
    });
    fetchMock.mockResolvedValue(
      new Response(body, {
        status: 200,
        headers: { 'content-type': 'audio/webm' },
      }),
    );

    await expect(
      service.transcribe('https://project.example.com/audio.webm'),
    ).rejects.toMatchObject({ errorCode: ErrorCode.AUDIO_TOO_LARGE });
    expect(mockOpenAI.transcribe).not.toHaveBeenCalled();
  });

  it('chỉ chuyển buffer hợp lệ sang OpenAI gateway', async () => {
    fetchMock.mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: {
          'content-type': 'audio/webm',
          'content-length': '3',
        },
      }),
    );
    mockOpenAI.transcribe.mockResolvedValue({
      text: 'Xin chào',
      durationSeconds: 2,
    });

    await expect(
      service.transcribe('https://project.example.com/audio.webm'),
    ).resolves.toEqual({ text: 'Xin chào', durationSeconds: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestedUrl, options] = fetchMock.mock.calls[0];
    expect(requestedUrl).toBeInstanceOf(URL);
    expect(options?.redirect).toBe('error');
    expect(options?.signal).toBeDefined();
    expect(mockOpenAI.transcribe).toHaveBeenCalledWith(
      expect.objectContaining({
        audioBuffer: Buffer.from([1, 2, 3]),
        mimeType: 'audio/webm',
      }),
    );
  });

  describe('timeout policy', () => {
    const buildService = (overrides: Record<string, string | number> = {}) =>
      new SpeechToText(
        mockOpenAI,
        createMockConfigService({
          APP_URL: 'https://project.example.com',
          AUDIO_ALLOWED_HOSTS: '',
          NODE_ENV: 'production',
          ...overrides,
        }) as unknown as ConfigService,
        mockStorageAdapter,
      );
    const localUrl =
      'https://project.example.com/media/audio/stream?key=user-1/audio.webm';

    it('Whisper nhận timeout mặc định 60s (không phải 15s tải file) ở nhánh local disk', async () => {
      mockStorageAdapter.readBuffer.mockResolvedValue(Buffer.from([1]));
      mockOpenAI.transcribe.mockResolvedValue({ text: 'a', durationSeconds: 1 });

      await service.transcribe(localUrl);

      expect(mockOpenAI.transcribe).toHaveBeenCalledWith(
        expect.objectContaining({ timeoutMs: 60_000 }),
      );
    });

    it('WHISPER_TIMEOUT_MS cấu hình được và áp dụng cho nhánh local disk', async () => {
      mockStorageAdapter.readBuffer.mockResolvedValue(Buffer.from([1]));
      mockOpenAI.transcribe.mockResolvedValue({ text: 'a', durationSeconds: 1 });

      await buildService({ WHISPER_TIMEOUT_MS: 90_000 }).transcribe(localUrl);

      expect(mockOpenAI.transcribe).toHaveBeenCalledWith(
        expect.objectContaining({ timeoutMs: 90_000 }),
      );
    });

    it('WHISPER_TIMEOUT_MS không hợp lệ quay về 60s', async () => {
      mockStorageAdapter.readBuffer.mockResolvedValue(Buffer.from([1]));
      mockOpenAI.transcribe.mockResolvedValue({ text: 'a', durationSeconds: 1 });

      await buildService({ WHISPER_TIMEOUT_MS: -1 }).transcribe(localUrl);

      expect(mockOpenAI.transcribe).toHaveBeenCalledWith(
        expect.objectContaining({ timeoutMs: 60_000 }),
      );
    });

    it('nhánh HTTP: fetch dùng 15s, còn Whisper dùng WHISPER_TIMEOUT_MS', async () => {
      const timeoutSpy = jest.spyOn(AbortSignal, 'timeout');
      fetchMock.mockResolvedValue(
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { 'content-type': 'audio/webm', 'content-length': '3' },
        }),
      );
      mockOpenAI.transcribe.mockResolvedValue({ text: 'a', durationSeconds: 1 });

      await buildService({ WHISPER_TIMEOUT_MS: 75_000 }).transcribe(
        'https://project.example.com/audio.webm',
      );

      expect(timeoutSpy).toHaveBeenCalledWith(15_000);
      expect(mockOpenAI.transcribe).toHaveBeenCalledWith(
        expect.objectContaining({ timeoutMs: 75_000 }),
      );
      timeoutSpy.mockRestore();
    });
  });
});
