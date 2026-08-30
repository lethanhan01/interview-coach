import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { createMockUserService } from '@core/test-utils/mock-factories';

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: ReturnType<typeof createMockUserService>;

  const mockReq = (userId = 'user-abc') => ({ user: { id: userId } }) as any;

  beforeEach(async () => {
    mockUserService = createMockUserService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /profile', () => {
    it('gọi userService.getProfile với userId và trả về profile', async () => {
      const userWithProfile = {
        id: 'user-abc',
        email: 'test@example.com',
        firstname: 'Nguyen',
        lastname: 'Van A',
        role: 'candidate',
        status: 'active',
        profile: null,
      };
      mockUserService.getProfile.mockResolvedValue(userWithProfile);

      const result = await controller.getProfile(mockReq());

      expect(result).toEqual(userWithProfile);
      expect(mockUserService.getProfile).toHaveBeenCalledWith('user-abc');
    });
  });

  describe('PATCH /profile', () => {
    it('gọi userService.upsertProfile với userId và dto', async () => {
      const dto = {
        firstname: 'Nguyen',
        lastname: 'Van A',
        technicalSkills: [{ name: 'TypeScript' }],
      } as any;
      const updatedProfile = { userId: 'user-abc', ...dto };
      mockUserService.upsertProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(dto, mockReq());

      expect(result).toEqual(updatedProfile);
      expect(mockUserService.upsertProfile).toHaveBeenCalledWith(
        'user-abc',
        dto,
      );
    });

    it('propagate exception khi userService.upsertProfile ném lỗi', async () => {
      const dto = { firstname: 'An' } as any;
      mockUserService.upsertProfile.mockRejectedValue(new Error('DB error'));

      await expect(controller.updateProfile(dto, mockReq())).rejects.toThrow(
        'DB error',
      );
    });
  });
});
