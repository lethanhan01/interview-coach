import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('hydrates the request from the local auth cookie', async () => {
    const auth = {
      getCookieName: jest.fn().mockReturnValue('auth'),
      getAuthenticatedUser: jest
        .fn()
        .mockResolvedValue({ id: 'u1', email: 'u@example.com', role: 'admin' }),
    };
    const request: Record<string, unknown> = { cookies: { auth: 'token' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    await expect(
      new JwtAuthGuard(auth as never).canActivate(context),
    ).resolves.toBe(true);
    expect(request.user).toEqual({
      id: 'u1',
      email: 'u@example.com',
      role: 'admin',
    });
  });

  it('rejects missing cookies', async () => {
    const auth = { getCookieName: () => 'auth' };
    const context = {
      switchToHttp: () => ({ getRequest: () => ({ cookies: {} }) }),
    } as unknown as ExecutionContext;
    await expect(
      new JwtAuthGuard(auth as never).canActivate(context),
    ).rejects.toThrow('Authentication cookie is required');
  });
});
