import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@core/common/guards';
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

  describe('GET /users/me', () => {
    it('calls userService.getAccount with userId and returns user account', async () => {
      const userAccount = {
        id: 'user-abc',
        email: 'test@example.com',
        firstname: 'Nguyen',
        lastname: 'Van A',
        role: 'candidate',
        status: 'active',
        createdAt: new Date(),
      };
      mockUserService.getAccount.mockResolvedValue(userAccount);

      const result = await controller.getMe(mockReq());

      expect(result).toEqual(userAccount);
      expect(mockUserService.getAccount).toHaveBeenCalledWith('user-abc');
    });
  });

  describe('PATCH /users/me', () => {
    it('calls userService.updateAccount with userId and dto', async () => {
      const dto = {
        firstname: 'Nguyen',
        lastname: 'Van B',
      };
      const updatedAccount = {
        id: 'user-abc',
        email: 'test@example.com',
        firstname: 'Nguyen',
        lastname: 'Van B',
        role: 'candidate',
        status: 'active',
        createdAt: new Date(),
      };
      mockUserService.updateAccount.mockResolvedValue(updatedAccount);

      const result = await controller.updateMe(dto, mockReq());

      expect(result).toEqual(updatedAccount);
      expect(mockUserService.updateAccount).toHaveBeenCalledWith(
        'user-abc',
        dto,
      );
    });

    it('propagates exception when userService.updateAccount throws', async () => {
      const dto = { firstname: 'An' };
      mockUserService.updateAccount.mockRejectedValue(new Error('DB error'));

      await expect(controller.updateMe(dto, mockReq())).rejects.toThrow(
        'DB error',
      );
    });
  });
});
