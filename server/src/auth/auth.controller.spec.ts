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
    it('trả về token mock và set refresh_token cookie cho MVP', () => {
      const res = mockRes();

      const result = controller.refresh(res);

      expect(result).toEqual({
        success: true,
        data: { accessToken: 'dev-mock-token', expiresIn: 3600 },
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'mvp-refresh-token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/logout', () => {
    it('xoá cookie mà không gọi Supabase cho MVP', () => {
      const res = mockRes();

      controller.logout(res);

      expect(mockAuthService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({ httpOnly: true }),
      );
    });
  });
});
