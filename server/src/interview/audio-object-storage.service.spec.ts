import { AudioObjectStorage } from './audio-object-storage.service';
import type { IPrivateMediaStorage } from './media-storage.interface';
import { ErrorCode } from '../common/exceptions/error-code.enum';

describe('AudioObjectStorage', () => {
  let mockStorage: jest.Mocked<IPrivateMediaStorage>;
  let service: AudioObjectStorage;

  beforeEach(() => {
    mockStorage = {
      upload: jest.fn(),
      createSignedUrl: jest.fn(),
      delete: jest.fn(),
    };
    service = new AudioObjectStorage(mockStorage);
  });

  it('từ chối khi không có buffer file âm thanh', async () => {
    await expect(
      service.uploadInterviewAudio({
        sessionId: 'session-1',
        userId: 'user-1',
        file: undefined,
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.INVALID_ANSWER_TYPE });
  });

  it('từ chối định dạng tệp không được hỗ trợ', async () => {
    await expect(
      service.uploadInterviewAudio({
        sessionId: 'session-1',
        userId: 'user-1',
        file: { buffer: Buffer.from('audio'), mimetype: 'audio/aac', size: 100 },
      }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.INVALID_ANSWER_TYPE });
  });

  it('ủy quyền upload cho IPrivateMediaStorage và trả về metadata đầy đủ', async () => {
    mockStorage.upload.mockResolvedValue({
      mediaKey: 'user-1/session-1/audio-123.webm',
      audioSizeBytes: 500,
      audioFileUrl: 'https://storage.example/signed-url',
    });

    const result = await service.uploadInterviewAudio({
      sessionId: 'session-1',
      userId: 'user-1',
      file: { buffer: Buffer.from('audio'), mimetype: 'audio/webm', size: 500 },
    });

    expect(mockStorage.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringMatching(/^user-1\/session-1\/audio-.+\.webm$/),
        file: { buffer: Buffer.from('audio'), mimetype: 'audio/webm', size: 500 },
      }),
    );
    expect(result).toEqual({
      mediaKey: 'user-1/session-1/audio-123.webm',
      audioSizeBytes: 500,
      audioFileUrl: 'https://storage.example/signed-url',
    });
  });

  it('ủy quyền getSignedUrl cho IPrivateMediaStorage', async () => {
    mockStorage.createSignedUrl.mockResolvedValue({
      signedUrl: 'https://storage.example/signed-url',
      expiresInSeconds: 1800,
    });

    const result = await service.getSignedUrl('user-1/session-1/audio-123.webm', 1800);

    expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(
      'user-1/session-1/audio-123.webm',
      1800,
    );
    expect(result).toEqual({
      signedUrl: 'https://storage.example/signed-url',
      expiresInSeconds: 1800,
    });
  });
});
