import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { ConfigService } from '@nestjs/config';
import { LocalDiskMediaStorageAdapter } from './local-disk-media-storage.adapter';
import { createMockConfigService } from '@core/test-utils/mock-factories';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';

describe('LocalDiskMediaStorageAdapter', () => {
  let adapter: LocalDiskMediaStorageAdapter;
  let testStorageDir: string;

  beforeEach(async () => {
    testStorageDir = path.join(
      os.tmpdir(),
      `interview-audio-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await fs.promises.mkdir(testStorageDir, { recursive: true });

    const config = createMockConfigService({
      APP_URL: 'http://localhost:3000',
      MEDIA_STORAGE_PATH: testStorageDir,
      AUTH_JWT_SECRET: 'test-secret-at-least-32-characters-long',
      MEDIA_SIGNED_URL_TTL_SECONDS: '1800',
    });

    adapter = new LocalDiskMediaStorageAdapter(
      config as unknown as ConfigService,
    );
  });

  afterEach(async () => {
    try {
      await fs.promises.rm(testStorageDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error in test
    }
  });

  it('lưu file thành công và trả về Signed URL', async () => {
    const file = {
      buffer: Buffer.from('test audio content'),
      mimetype: 'audio/webm',
      size: 18,
    };

    const result = await adapter.upload({
      path: 'user-1/session-1/audio-123.webm',
      file,
    });

    expect(result.mediaKey).toBe('user-1/session-1/audio-123.webm');
    expect(result.audioSizeBytes).toBe(18);
    expect(result.audioFileUrl).toContain('/media/audio/stream?key=');
    expect(result.audioFileUrl).toContain('token=');

    const expectedDiskPath = path.join(
      testStorageDir,
      'user-1',
      'session-1',
      'audio-123.webm',
    );
    expect(fs.existsSync(expectedDiskPath)).toBe(true);
    const content = await fs.promises.readFile(expectedDiskPath, 'utf8');
    expect(content).toBe('test audio content');
  });

  it('xác thực token HMAC hợp lệ và từ chối token sai hoặc hết hạn', async () => {
    const mediaKey = 'user-1/audio.webm';
    const expires = Math.floor(Date.now() / 1000) + 1800;

    const token = adapter.generateHmac(mediaKey, expires);
    expect(adapter.verifyToken(mediaKey, expires, token)).toBe(true);

    expect(adapter.verifyToken(mediaKey, expires, 'tampered-token')).toBe(
      false,
    );

    // Thời gian hết hạn khác
    expect(adapter.verifyToken(mediaKey, expires + 10, token)).toBe(false);

    // mediaKey khác
    expect(adapter.verifyToken('different-key.webm', expires, token)).toBe(
      false,
    );
  });

  it('chặn tấn công path traversal khi gọi resolveSafePath', () => {
    expect(() => adapter.resolveSafePath('../../etc/passwd')).toThrow(
      expect.objectContaining({ errorCode: ErrorCode.FORBIDDEN }),
    );

    expect(() => adapter.resolveSafePath('foo/bar/\0/baz')).toThrow(
      expect.objectContaining({ errorCode: ErrorCode.FORBIDDEN }),
    );

    expect(() => adapter.resolveSafePath('')).toThrow(
      expect.objectContaining({ errorCode: ErrorCode.INVALID_AUDIO_URL }),
    );
  });

  it('đọc buffer trực tiếp từ ổ đĩa và ném NOT_FOUND nếu file không tồn tại', async () => {
    const file = {
      buffer: Buffer.from('hello world audio'),
      mimetype: 'audio/wav',
      size: 17,
    };
    await adapter.upload({ path: 'test/sample.wav', file });

    const buffer = await adapter.readBuffer('test/sample.wav');
    expect(buffer.toString('utf8')).toBe('hello world audio');

    await expect(adapter.readBuffer('non-existent.wav')).rejects.toMatchObject({
      errorCode: ErrorCode.NOT_FOUND,
    });
  });

  it('xóa file thành công khỏi ổ đĩa', async () => {
    const file = {
      buffer: Buffer.from('data to delete'),
      mimetype: 'audio/mp4',
      size: 14,
    };
    await adapter.upload({ path: 'test/delete-me.mp4', file });

    await adapter.delete('test/delete-me.mp4');
    const diskPath = path.join(testStorageDir, 'test', 'delete-me.mp4');
    expect(fs.existsSync(diskPath)).toBe(false);

    // Xóa file không tồn tại không ném lỗi
    await expect(adapter.delete('test/delete-me.mp4')).resolves.not.toThrow();
  });
});
