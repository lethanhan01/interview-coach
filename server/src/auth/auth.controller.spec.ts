import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { createMockAuthService } from '../test-utils/mock-factories';

describe('AuthController', () => {
  let controller: AuthController;
  let auth: ReturnType<typeof createMockAuthService>;

  beforeEach(async () => {
    auth = createMockAuthService();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController], providers: [{ provide: AuthService, useValue: auth }],
    }).overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true }).compile();
    controller = module.get(AuthController);
  });

  it('returns the DB role and Supabase verification state from /auth/me', async () => {
    auth.getMe.mockResolvedValue({ id: 'u1', email: 'user@example.com', role: 'admin', status: 'active' });
    await expect(controller.me({ user: { id: 'u1', email: 'user@example.com', role: 'admin', emailVerified: false } }))
      .resolves.toEqual({ success: true, data: { id: 'u1', email: 'user@example.com', role: 'admin', status: 'active', emailVerified: false } });
  });

  it('delegates logout cleanup without a mock refresh cookie', async () => {
    await controller.logout();
    expect(auth.logout).toHaveBeenCalled();
  });
});
