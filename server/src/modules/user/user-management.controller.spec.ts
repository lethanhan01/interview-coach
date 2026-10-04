import { Test, TestingModule } from '@nestjs/testing';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';
import { createMockUserManagementService } from '@core/test-utils/mock-factories';
import { UserRole, AccountStatus } from '@prisma/client';

describe('UserManagementController', () => {
  let controller: UserManagementController;
  let mockService: ReturnType<typeof createMockUserManagementService>;

  beforeEach(async () => {
    mockService = createMockUserManagementService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserManagementController],
      providers: [
        {
          provide: UserManagementService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UserManagementController>(UserManagementController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /users', () => {
    it('returns list of users wrapped in success object', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          firstname: 'User',
          lastname: 'One',
          role: UserRole.candidate,
          status: AccountStatus.active,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockService.listUsers.mockResolvedValue(mockUsers);

      const result = await controller.listUsers();

      expect(result).toEqual({ success: true, data: mockUsers });
      expect(mockService.listUsers).toHaveBeenCalled();
    });
  });

  describe('GET /users/:id', () => {
    it('returns single user by ID', async () => {
      const mockUser = {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'user1@example.com',
        firstname: 'User',
        lastname: 'One',
        role: UserRole.candidate,
        status: AccountStatus.active,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
      };
      mockService.getUser.mockResolvedValue(mockUser);

      const result = await controller.getUser(
        '11111111-1111-1111-1111-111111111111',
      );

      expect(result).toEqual({ success: true, data: mockUser });
      expect(mockService.getUser).toHaveBeenCalledWith(
        '11111111-1111-1111-1111-111111111111',
      );
    });

    it('throws USER_NOT_FOUND when user does not exist', async () => {
      mockService.getUser.mockResolvedValue(null);

      await expect(
        controller.getUser('11111111-1111-1111-1111-111111111111'),
      ).rejects.toThrow('User not found');
    });
  });

  describe('PATCH /users/:id', () => {
    it('updates user role/status and returns updated record', async () => {
      const updatedUser = {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'user1@example.com',
        role: UserRole.candidate,
        status: AccountStatus.locked,
      };
      mockService.updateUser.mockResolvedValue(updatedUser);

      const result = await controller.updateUser(
        '11111111-1111-1111-1111-111111111111',
        'admin-uuid',
        { status: AccountStatus.locked },
      );

      expect(result).toEqual({ success: true, data: updatedUser });
      expect(mockService.updateUser).toHaveBeenCalledWith(
        '11111111-1111-1111-1111-111111111111',
        'admin-uuid',
        { status: AccountStatus.locked },
      );
    });
  });

  describe('DELETE /users/:id', () => {
    it('deletes user account', async () => {
      mockService.deleteUser.mockResolvedValue(undefined);

      await controller.deleteUser(
        '11111111-1111-1111-1111-111111111111',
        'admin-uuid',
      );

      expect(mockService.deleteUser).toHaveBeenCalledWith(
        '11111111-1111-1111-1111-111111111111',
        'admin-uuid',
      );
    });
  });
});
