import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { createMockPrismaService } from '../test-utils/mock-factories';

describe('UserService', () => {
  let service: UserService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  const BASE_USER = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user',
    status: 'active',
    profileCompleted: false,
    createdAt: new Date(),
    profile: null,
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

  describe('getProfile', () => {
    it('trả về user với profile khi tìm thấy', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);

      const result = await service.getProfile('user-123');

      expect(result).toEqual(BASE_USER);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { profile: true },
      });
    });

    it('ném NOT_FOUND (404) khi user không tồn tại', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        InterviewAIException,
      );

      mockPrisma.user.findUnique.mockResolvedValue(null);
      try {
        await service.getProfile('nonexistent');
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(ErrorCode.NOT_FOUND);
        expect((e as InterviewAIException).getStatus()).toBe(
          HttpStatus.NOT_FOUND,
        );
      }
    });
  });

  describe('upsertProfile', () => {
    it('gọi prisma.userProfile.upsert với params đúng và trả về profile', async () => {
      const dto = {
        fullName: 'Nguyen Van A',
        targetPosition: 'Backend Dev',
        technicalSkills: [{ name: 'TypeScript' }],
        certifications: [],
        awards: [],
      };
      const upsertedProfile = { userId: 'user-123', ...dto };
      const updatedUser = { ...BASE_USER, profile: upsertedProfile };
      mockPrisma.userProfile.upsert.mockResolvedValue(upsertedProfile);
      mockPrisma.user.findUnique.mockResolvedValue(updatedUser);

      const result = await service.upsertProfile('user-123', dto);

      expect(result).toEqual(updatedUser);
      expect(mockPrisma.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        create: expect.objectContaining({ userId: 'user-123' }),
        update: expect.objectContaining(dto),
      });
    });
  });
});
