import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { SupabaseMediaStorageAdapter } from './supabase-media-storage.adapter';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {},
  })),
}));

describe('SupabaseMediaStorageAdapter', () => {
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

    new SupabaseMediaStorageAdapter(config);

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

  it('uploads file and returns mediaKey and pre-signed URL', async () => {
    const upload = jest.fn().mockResolvedValue({ error: null });
    const createSignedUrl = jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.example/interview-audio/signed-audio.webm?token=xyz' },
      error: null,
    });
    (createClient as jest.Mock).mockReturnValue({
      storage: {
        from: jest.fn().mockReturnValue({ upload, createSignedUrl }),
      },
    });
    const adapter = new SupabaseMediaStorageAdapter({
      getOrThrow: jest.fn(() => 'value'),
    } as unknown as ConfigService);

    const result = await adapter.upload({
      path: 'user-1/session-1/audio-123.webm',
      file: { buffer: Buffer.from('audio'), mimetype: 'audio/webm', size: 1024 },
    });

    expect(upload).toHaveBeenCalledWith(
      'user-1/session-1/audio-123.webm',
      expect.any(Buffer),
      { contentType: 'audio/webm', upsert: false },
    );
    expect(createSignedUrl).toHaveBeenCalledWith('user-1/session-1/audio-123.webm', 1800);
    expect(result).toEqual({
      mediaKey: 'user-1/session-1/audio-123.webm',
      audioSizeBytes: 1024,
      audioFileUrl: 'https://storage.example/interview-audio/signed-audio.webm?token=xyz',
    });
  });

  it('creates signed download url with custom expiration', async () => {
    const createSignedUrl = jest.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.example/interview-audio/custom-exp.webm?token=abc' },
      error: null,
    });
    (createClient as jest.Mock).mockReturnValue({
      storage: {
        from: jest.fn().mockReturnValue({ createSignedUrl }),
      },
    });
    const adapter = new SupabaseMediaStorageAdapter({
      getOrThrow: jest.fn(() => 'value'),
    } as unknown as ConfigService);

    const result = await adapter.createSignedUrl('user-1/session-1/audio-123.webm', 3600);

    expect(createSignedUrl).toHaveBeenCalledWith('user-1/session-1/audio-123.webm', 3600);
    expect(result).toEqual({
      signedUrl: 'https://storage.example/interview-audio/custom-exp.webm?token=abc',
      expiresInSeconds: 3600,
    });
  });

  it('deletes media by key', async () => {
    const remove = jest.fn().mockResolvedValue({ data: [], error: null });
    (createClient as jest.Mock).mockReturnValue({
      storage: {
        from: jest.fn().mockReturnValue({ remove }),
      },
    });
    const adapter = new SupabaseMediaStorageAdapter({
      getOrThrow: jest.fn(() => 'value'),
    } as unknown as ConfigService);

    await adapter.delete('user-1/session-1/audio-123.webm');

    expect(remove).toHaveBeenCalledWith(['user-1/session-1/audio-123.webm']);
  });
});
