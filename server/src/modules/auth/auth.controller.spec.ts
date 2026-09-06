import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('returns only public account fields from /auth/me', async () => {
    const auth = {
      getMe: jest.fn().mockResolvedValue({
        id: 'u1',
        email: 'u@example.com',
        firstname: 'Ada',
        lastname: 'Lovelace',
        role: 'admin',
        status: 'active',
        emailVerified: true,
      }),
    };
    const config = { get: jest.fn().mockReturnValue('development') };
    const controller = new AuthController(auth as never, config as never);
    await expect(controller.me({ user: { id: 'u1' } })).resolves.toEqual({
      success: true,
      data: {
        id: 'u1',
        email: 'u@example.com',
        firstname: 'Ada',
        lastname: 'Lovelace',
        role: 'admin',
        status: 'active',
        emailVerified: true,
      },
    });
  });

  describe('logout', () => {
    it('revokes refresh token and clears both access and refresh cookies', async () => {
      const auth = {
        getRefreshCookieName: jest.fn().mockReturnValue('interviewcoach_refresh'),
        getAccessCookieName: jest.fn().mockReturnValue('interviewcoach_access'),
        logout: jest.fn().mockResolvedValue(undefined),
      };
      const config = { get: jest.fn().mockReturnValue('development') };
      const controller = new AuthController(auth as never, config as never);

      const mockReq = {
        cookies: { interviewcoach_refresh: 'sample-refresh-token' },
      };
      const mockRes = {
        clearCookie: jest.fn(),
      };

      await controller.logout(mockReq as never, mockRes as never);

      expect(auth.logout).toHaveBeenCalledWith('sample-refresh-token');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('interviewcoach_access', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
      expect(mockRes.clearCookie).toHaveBeenCalledWith('interviewcoach_refresh', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
    });

    it('still clears cookies gracefully when no refresh cookie is provided', async () => {
      const auth = {
        getRefreshCookieName: jest.fn().mockReturnValue('interviewcoach_refresh'),
        getAccessCookieName: jest.fn().mockReturnValue('interviewcoach_access'),
        logout: jest.fn().mockResolvedValue(undefined),
      };
      const config = { get: jest.fn().mockReturnValue('production') };
      const controller = new AuthController(auth as never, config as never);

      const mockReq = { cookies: {} };
      const mockRes = { clearCookie: jest.fn() };

      await controller.logout(mockReq as never, mockRes as never);

      expect(auth.logout).toHaveBeenCalledWith(undefined);
      expect(mockRes.clearCookie).toHaveBeenCalledWith('interviewcoach_access', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });
      expect(mockRes.clearCookie).toHaveBeenCalledWith('interviewcoach_refresh', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      });
    });
  });

  describe('refresh', () => {
    it('sets new cookies and returns public user on valid refresh token', async () => {
      const auth = {
        getRefreshCookieName: jest.fn().mockReturnValue('interviewcoach_refresh'),
        getAccessCookieName: jest.fn().mockReturnValue('interviewcoach_access'),
        getAccessCookieMaxAge: jest.fn().mockReturnValue(900),
        getRefreshCookieMaxAge: jest.fn().mockReturnValue(604800),
        refreshSession: jest.fn().mockResolvedValue({
          user: {
            id: 'u1',
            email: 'u@example.com',
            role: 'candidate',
            status: 'active',
            firstname: 'John',
            lastname: 'Doe',
            emailVerified: true,
          },
          tokens: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
          },
        }),
      };
      const config = { get: jest.fn().mockReturnValue('development') };
      const controller = new AuthController(auth as never, config as never);

      const mockReq = { cookies: { interviewcoach_refresh: 'valid-token' } };
      const mockRes = { cookie: jest.fn(), clearCookie: jest.fn() };

      const res = await controller.refresh(mockReq as never, mockRes as never);

      expect(res.success).toBe(true);
      expect(res.data.id).toBe('u1');
      expect(mockRes.cookie).toHaveBeenCalledTimes(2);
    });

    it('clears cookies when refreshSession throws an error', async () => {
      const auth = {
        getRefreshCookieName: jest.fn().mockReturnValue('interviewcoach_refresh'),
        getAccessCookieName: jest.fn().mockReturnValue('interviewcoach_access'),
        refreshSession: jest
          .fn()
          .mockRejectedValue(new Error('Compromised refresh token detected')),
      };
      const config = { get: jest.fn().mockReturnValue('development') };
      const controller = new AuthController(auth as never, config as never);

      const mockReq = { cookies: { interviewcoach_refresh: 'compromised-token' } };
      const mockRes = { clearCookie: jest.fn() };

      await expect(
        controller.refresh(mockReq as never, mockRes as never),
      ).rejects.toThrow('Compromised refresh token detected');

      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'interviewcoach_access',
        expect.any(Object),
      );
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'interviewcoach_refresh',
        expect.any(Object),
      );
    });
  });
});

