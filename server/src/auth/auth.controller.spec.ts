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
      }),
    };
    const controller = new AuthController(auth as never);
    await expect(controller.me({ user: { id: 'u1' } })).resolves.toEqual({
      success: true,
      data: {
        id: 'u1',
        email: 'u@example.com',
        firstname: 'Ada',
        lastname: 'Lovelace',
        role: 'admin',
        status: 'active',
      },
    });
  });
});
