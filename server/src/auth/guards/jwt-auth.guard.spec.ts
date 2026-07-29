import type { ExecutionContext } from '@nestjs/common';
import { ErrorCode } from '../../common/exceptions/error-code.enum';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const request = { headers: { authorization: 'Bearer access-token' } };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  it('returns ACCOUNT_INACTIVE for locked and deleted users', async () => {
    const config = { get: jest.fn().mockReturnValue('true') };
    const authService = {
      validateAccessToken: jest.fn().mockResolvedValue({
        id: '0fca0a4d-279a-4ab0-8981-4c56d4d901da',
        email: 'locked@example.com',
        emailVerified: true,
      }),
      ensureUser: jest.fn().mockResolvedValue({ status: 'locked' }),
    };
    const guard = new JwtAuthGuard(config as never, {} as never, authService as never);

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      errorCode: ErrorCode.ACCOUNT_INACTIVE,
      status: 401,
    });
  });
});
