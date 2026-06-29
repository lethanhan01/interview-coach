import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('refreshToken', () => {
    it('trả về token mock cho MVP', async () => {
      await expect(service.refreshToken()).resolves.toEqual({
        accessToken: 'dev-mock-token',
        refreshToken: 'mvp-refresh-token',
        expiresIn: 3600,
      });
    });
  });

  describe('logout', () => {
    it('không gọi provider auth ngoài và luôn thành công', async () => {
      await expect(service.logout()).resolves.toBeUndefined();
    });
  });
});
