import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createClient } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { createMockConfigService } from '../test-utils/mock-factories';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    auth: {
      refreshSession: jest.fn(),
      admin: { signOut: jest.fn() },
    },
  }),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockRefreshSession: jest.Mock;
  let mockAdminSignOut: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();

    const cfg = createMockConfigService({
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'mock-key',
    });

    const module = await Test.createTestingModule({
      providers: [AuthService, { provide: ConfigService, useValue: cfg }],
    }).compile();

    service = module.get<AuthService>(AuthService);

    const mockClient = (createClient as jest.Mock).mock.results[0].value as {
      auth: { refreshSession: jest.Mock; admin: { signOut: jest.Mock } };
    };
    mockRefreshSession = mockClient.auth.refreshSession;
    mockAdminSignOut = mockClient.auth.admin.signOut;
  });

  describe('refreshToken', () => {
    it('trả về accessToken, refreshToken, expiresIn khi thành công', async () => {
      mockRefreshSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'at',
            refresh_token: 'rt',
            expires_in: 3600,
          },
        },
        error: null,
      });

      const result = await service.refreshToken('old-rt');

      expect(result).toEqual({
        accessToken: 'at',
        refreshToken: 'rt',
        expiresIn: 3600,
      });
    });

    it('dùng expiresIn = 3600 khi Supabase không trả expires_in', async () => {
      mockRefreshSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'at',
            refresh_token: 'rt',
            expires_in: undefined,
          },
        },
        error: null,
      });

      const result = await service.refreshToken('old-rt');
      expect(result.expiresIn).toBe(3600);
    });

    it('throw TOKEN_EXPIRED (401) khi Supabase trả error', async () => {
      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Token expired' },
      });

      await expect(service.refreshToken('bad-token')).rejects.toThrow(
        InterviewAIException,
      );

      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Token expired' },
      });
      try {
        await service.refreshToken('bad-token');
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(
          ErrorCode.TOKEN_EXPIRED,
        );
        expect((e as InterviewAIException).getStatus()).toBe(
          HttpStatus.UNAUTHORIZED,
        );
      }
    });

    it('throw khi session là null dù không có error', async () => {
      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });
      await expect(service.refreshToken('old-rt')).rejects.toThrow(
        InterviewAIException,
      );
    });
  });

  describe('logout', () => {
    it('gọi supabase.auth.admin.signOut với userId', async () => {
      mockAdminSignOut.mockResolvedValue({ error: null });
      await service.logout('user-123');
      expect(mockAdminSignOut).toHaveBeenCalledWith('user-123');
    });

    it('không throw khi logout thành công', async () => {
      mockAdminSignOut.mockResolvedValue({ error: null });
      await expect(service.logout('user-123')).resolves.toBeUndefined();
    });

    it('throw INTERNAL_ERROR (500) khi signOut thất bại', async () => {
      mockAdminSignOut.mockResolvedValue({
        error: { message: 'Network error' },
      });

      await expect(service.logout('user-123')).rejects.toThrow(
        InterviewAIException,
      );

      mockAdminSignOut.mockResolvedValue({
        error: { message: 'Network error' },
      });
      try {
        await service.logout('user-123');
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(
          ErrorCode.INTERNAL_ERROR,
        );
        expect((e as InterviewAIException).getStatus()).toBe(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });
  });
});
