import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { StreamAudioService } from './stream-audio.service';
import { LocalDiskMediaStorageAdapter } from '@infra/storage/local-disk-media-storage.adapter';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';

describe('StreamAudioService', () => {
  let service: StreamAudioService;
  let mockAdapter: jest.Mocked<LocalDiskMediaStorageAdapter>;
  let testFile: string;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(
      os.tmpdir(),
      `stream-audio-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await fs.promises.mkdir(tempDir, { recursive: true });
    testFile = path.join(tempDir, 'audio-sample.webm');
    await fs.promises.writeFile(testFile, Buffer.from('0123456789ABCDEF')); // 16 bytes

    mockAdapter = {
      verifyToken: jest.fn(),
      resolveSafePath: jest.fn().mockReturnValue(testFile),
    } as unknown as jest.Mocked<LocalDiskMediaStorageAdapter>;

    service = new StreamAudioService(mockAdapter);
  });

  afterEach(async () => {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  it('từ chối request khi liên kết đã hết hạn', async () => {
    const pastExpires = Math.floor(Date.now() / 1000) - 10;
    await expect(
      service.getAudioStream({
        key: 'sample.webm',
        expires: pastExpires,
        token: 'any-token',
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.TOKEN_EXPIRED });
  });

  it('từ chối request khi chữ ký token không hợp lệ', async () => {
    mockAdapter.verifyToken.mockReturnValue(false);
    const futureExpires = Math.floor(Date.now() / 1000) + 1800;

    await expect(
      service.getAudioStream({
        key: 'sample.webm',
        expires: futureExpires,
        token: 'invalid-token',
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.FORBIDDEN });
  });

  it('từ chối khi tệp tin không tồn tại trên máy chủ', async () => {
    mockAdapter.verifyToken.mockReturnValue(true);
    mockAdapter.resolveSafePath.mockReturnValue(
      path.join(tempDir, 'not-exist.webm'),
    );
    const futureExpires = Math.floor(Date.now() / 1000) + 1800;

    await expect(
      service.getAudioStream({
        key: 'not-exist.webm',
        expires: futureExpires,
        token: 'valid-token',
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.NOT_FOUND });
  });

  it('trả về 200 OK và stream toàn bộ tệp khi không có Range header', async () => {
    mockAdapter.verifyToken.mockReturnValue(true);
    const futureExpires = Math.floor(Date.now() / 1000) + 1800;

    const result = await service.getAudioStream({
      key: 'audio-sample.webm',
      expires: futureExpires,
      token: 'valid-token',
    });

    expect(result.statusCode).toBe(200);
    expect(result.headers['Content-Length']).toBe(16);
    expect(result.headers['Content-Type']).toBe('audio/webm');
    expect(result.headers['Accept-Ranges']).toBe('bytes');
  });

  it('trả về 206 Partial Content khi có Range header hợp lệ', async () => {
    mockAdapter.verifyToken.mockReturnValue(true);
    const futureExpires = Math.floor(Date.now() / 1000) + 1800;

    const result = await service.getAudioStream(
      {
        key: 'audio-sample.webm',
        expires: futureExpires,
        token: 'valid-token',
      },
      'bytes=0-7',
    );

    expect(result.statusCode).toBe(206);
    expect(result.headers['Content-Range']).toBe('bytes 0-7/16');
    expect(result.headers['Content-Length']).toBe(8);
  });

  it('báo lỗi khi Range header vượt quá kích thước file', async () => {
    mockAdapter.verifyToken.mockReturnValue(true);
    const futureExpires = Math.floor(Date.now() / 1000) + 1800;

    await expect(
      service.getAudioStream(
        {
          key: 'audio-sample.webm',
          expires: futureExpires,
          token: 'valid-token',
        },
        'bytes=50-60',
      ),
    ).rejects.toMatchObject({ errorCode: ErrorCode.VALIDATION_ERROR });
  });
});
