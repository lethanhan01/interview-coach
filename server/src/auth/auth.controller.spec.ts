import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshGuard } from './guards/refresh.guard';
import { createMockAuthService } from '../test-utils/mock-factories';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: ReturnType<typeof createMockAuthService>;

  const mockRes = () =>
    ({
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    }) as any;

  beforeEach(async () => {
    mockAuthService = createMockAuthService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    })
      .overrideGuard(RefreshGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('POST /auth/refresh', () => {
    it('trả về accessToken và set refresh_token cookie khi thành công', async () => {
      mockAuthService.refreshToken.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      });

      const req = { user: { refreshToken: 'old-refresh-token' } } as any;
      const res = mockRes();

      const result = await controller.refresh(req, res);

      expect(result).toEqual({
        success: true,
        data: { accessToken: 'new-access-token', expiresIn: 3600 },
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'new-refresh-token',
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('ném lỗi khi authService.refreshToken ném lỗi', async () => {
      mockAuthService.refreshToken.mockRejectedValue(new Error('Token expired'));
      const req = { user: { refreshToken: 'bad-token' } } as any;
      const res = mockRes();

      await expect(controller.refresh(req, res)).rejects.toThrow(
        'Token expired',
      );
    });
  });

  describe('POST /auth/logout', () => {
    it('gọi authService.logout và xoá cookie khi thành công', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);
      const req = { user: { id: 'user-123', email: 'a@b.com' } } as any;
      const res = mockRes();

      await controller.logout(req, res);

      expect(mockAuthService.logout).toHaveBeenCalledWith('user-123');
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({ httpOnly: true }),
      );
    });

    it('ném lỗi khi authService.logout ném lỗi', async () => {
      mockAuthService.logout.mockRejectedValue(new Error('Logout failed'));
      const req = { user: { id: 'user-123', email: 'a@b.com' } } as any;
      const res = mockRes();

      await expect(controller.logout(req, res)).rejects.toThrow(
        'Logout failed',
      );
    });
  });
});
