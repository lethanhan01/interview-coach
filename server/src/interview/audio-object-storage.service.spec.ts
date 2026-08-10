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
});
