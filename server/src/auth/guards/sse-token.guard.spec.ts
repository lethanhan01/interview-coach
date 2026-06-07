import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext } from '@nestjs/common';
import { SseTokenGuard } from './sse-token.guard';
import { createMockConfigService } from '../../test-utils/mock-factories';

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    verify: jest.fn(),
  },
}));

import jwt from 'jsonwebtoken';

describe('SseTokenGuard', () => {
  let guard: SseTokenGuard;
  const mockJwtVerify = jwt.verify as jest.Mock;

  const makeContext = (query: Record<string, string> = {}): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          query,
          user: undefined as unknown,
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(async () => {
    const mockConfig = createMockConfigService({
      SUPABASE_JWT_SECRET: 'test-secret',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SseTokenGuard,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    guard = module.get<SseTokenGuard>(SseTokenGuard);
  });

  afterEach(() => jest.clearAllMocks());

  it('trả về true và set req.user khi token hợp lệ', () => {
    mockJwtVerify.mockReturnValue({ sub: 'user-uuid-456' });
    const req = { query: { token: 'valid.jwt.token' }, user: undefined as unknown };
    const ctx = ({
      switchToHttp: () => ({ getRequest: () => req }),
    }) as unknown as ExecutionContext;

    const result = guard.canActivate(ctx);

    expect(result).toBe(true);
    expect((req.user as { id: string }).id).toBe('user-uuid-456');
  });

  it('trả về false khi không có token trong query', () => {
    const ctx = makeContext({});

    const result = guard.canActivate(ctx);

    expect(result).toBe(false);
    expect(mockJwtVerify).not.toHaveBeenCalled();
  });

  it('trả về false khi jwt.verify ném lỗi (token hết hạn hoặc không hợp lệ)', () => {
    mockJwtVerify.mockImplementation(() => {
      throw new Error('jwt expired');
    });
    const ctx = makeContext({ token: 'expired.jwt.token' });

    const result = guard.canActivate(ctx);

    expect(result).toBe(false);
  });
});
