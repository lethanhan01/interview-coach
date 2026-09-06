import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { createMockPrismaService } from '@core/test-utils/mock-factories';

describe('UserService', () => {
  let service: UserService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  const BASE_USER = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'secret-hash',
    tokenVersion: 2,
    firstname: 'Van A',
    lastname: 'Nguyen',
    role: 'candidate',
    status: 'active',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getAccount', () => {
    it('returns user account when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);

      const result = await service.getAccount('user-123');

      expect(result).toEqual({
        id: BASE_USER.id,
        email: BASE_USER.email,
        firstname: BASE_USER.firstname,
        lastname: BASE_USER.lastname,
        role: BASE_USER.role,
        status: BASE_USER.status,
        createdAt: BASE_USER.createdAt,
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('tokenVersion');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });
    });

    it('throws NOT_FOUND (404) when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getAccount('nonexistent')).rejects.toThrow(
        InterviewAIException,
      );

      mockPrisma.user.findUnique.mockResolvedValue(null);
      try {
        await service.getAccount('nonexistent');
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(
          ErrorCode.USER_NOT_FOUND,
        );
        expect((e as InterviewAIException).getStatus()).toBe(
          HttpStatus.NOT_FOUND,
        );
      }
    });
  });

  describe('updateAccount', () => {
    it('updates user firstname and lastname successfully', async () => {
      const dto = {
        firstname: 'UpdatedName',
        lastname: 'UpdatedLastName',
      };
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(BASE_USER)
        .mockResolvedValueOnce({
          ...BASE_USER,
          ...dto,
        });
      mockPrisma.user.update.mockResolvedValue({ ...BASE_USER, ...dto });

      const result = await service.updateAccount('user-123', dto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { firstname: 'UpdatedName', lastname: 'UpdatedLastName' },
      });
      expect(result.firstname).toBe('UpdatedName');
      expect(result.lastname).toBe('UpdatedLastName');
    });

    it('throws VALIDATION_ERROR when candidate provides empty name', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);

      await expect(
        service.updateAccount('user-123', { firstname: '   ' }),
      ).rejects.toThrow(InterviewAIException);

      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);
      try {
        await service.updateAccount('user-123', { firstname: '   ' });
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(
          ErrorCode.VALIDATION_ERROR,
        );
        expect((e as InterviewAIException).getStatus()).toBe(
          HttpStatus.BAD_REQUEST,
        );
      }
    });

    it('strips undefined so fields not sent are not modified', async () => {
      const dto = {
        firstname: 'Nguyen',
        lastname: undefined,
      };
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(BASE_USER)
        .mockResolvedValueOnce({ ...BASE_USER, firstname: 'Nguyen' });
      mockPrisma.user.update.mockResolvedValue({});

      await service.updateAccount('user-123', dto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { firstname: 'Nguyen' },
      });
    });

    it('throws NOT_FOUND when updating a non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAccount('nonexistent', { firstname: 'Test' }),
      ).rejects.toThrow(InterviewAIException);
    });
  });
});
