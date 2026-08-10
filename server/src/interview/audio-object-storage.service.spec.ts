import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { AudioObjectStorage } from './audio-object-storage.service';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {},
  })),
}));

describe('AudioObjectStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes a WebSocket transport to Supabase for Node.js 20 runtimes', () => {
    const config = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'SUPABASE_URL') {
          return 'https://example.supabase.co';
        }

        return 'service-role-key';
      }),
    } as unknown as ConfigService;

    new AudioObjectStorage(config);

    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'service-role-key',
      expect.objectContaining({
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        realtime: {
          transport: expect.any(Function),
        },
      }),
    );
  });

  it('characterizes the current public-URL storage contract', async () => {
    const upload = jest.fn().mockResolvedValue({ error: null });
    const getPublicUrl = jest.fn().mockReturnValue({
      data: { publicUrl: 'https://storage.example/interview-audio/audio.webm' },
    });
    (createClient as jest.Mock).mockReturnValue({
      storage: {
        from: jest.fn().mockReturnValue({ upload, getPublicUrl }),
      },
    });
    const storage = new AudioObjectStorage({
      getOrThrow: jest.fn(() => 'value'),
    } as unknown as ConfigService);

    const result = await storage.uploadInterviewAudio({
      sessionId: 'session-1',
      userId: 'user-1',
      file: { buffer: Buffer.from('audio'), mimetype: 'audio/webm', size: 5 },
    });

    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^user-1\/session-1\/audio-.+\.webm$/),
      expect.any(Buffer),
      { contentType: 'audio/webm', upsert: false },
    );
    expect(result).toEqual({
      audioFileUrl: 'https://storage.example/interview-audio/audio.webm',
      audioSizeBytes: 5,
    });
    expect(getPublicUrl).toHaveBeenCalledTimes(1);
  });
});
