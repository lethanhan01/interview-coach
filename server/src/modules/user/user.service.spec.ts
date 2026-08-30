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
    firstname: null,
    lastname: null,
    role: 'candidate',
    status: 'active',
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
    it('tra ve user voi profile khi tim thay', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);

      const result = await service.getProfile('user-123');

      expect(result).toEqual({
        id: BASE_USER.id,
        email: BASE_USER.email,
        firstname: BASE_USER.firstname,
        lastname: BASE_USER.lastname,
        profile: BASE_USER.profile,
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
          profile: {
            select: {
              personality: true,
              education: true,
              workExperience: true,
              projects: true,
              technicalSkills: true,
              certifications: true,
              awards: true,
            },
          },
        },
      });
    });

    it('tra ve 6 nhom CV truc tiep trong profile', async () => {
      const userWithProfile = {
        ...BASE_USER,
        profile: {
          userId: 'user-123',
          personality: null,
          education: { school: 'HUST' },
          workExperience: [],
          projects: [],
          technicalSkills: [{ name: 'TypeScript' }],
          certifications: [],
          awards: [],
        },
      };
      mockPrisma.user.findUnique.mockResolvedValue(userWithProfile);

      const result = await service.getProfile('user-123');

      expect(result).toEqual({
        id: BASE_USER.id,
        email: BASE_USER.email,
        firstname: BASE_USER.firstname,
        lastname: BASE_USER.lastname,
        profile: {
          personality: null,
          education: { school: 'HUST' },
          workExperience: [],
          projects: [],
          technicalSkills: [{ name: 'TypeScript' }],
          certifications: [],
          awards: [],
        },
      });
    });

    it('nem NOT_FOUND (404) khi user khong ton tai', async () => {
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
    it('upsert truc tiep profile va 6 nhom CV vao user_profiles', async () => {
      const dto = {
        firstname: 'Nguyen',
        lastname: 'Van A',
        education: { school: 'HUST' },
        technicalSkills: [{ name: 'TypeScript' }],
        certifications: [],
        awards: [],
      };
      mockPrisma.userProfile.upsert.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);

      await service.upsertProfile('user-123', dto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { firstname: 'Nguyen', lastname: 'Van A' },
      });
      expect(mockPrisma.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        create: {
          education: { school: 'HUST' },
          technicalSkills: [{ name: 'TypeScript' }],
          certifications: [],
          awards: [],
          userId: 'user-123',
        },
        update: {
          education: { school: 'HUST' },
          technicalSkills: [{ name: 'TypeScript' }],
          certifications: [],
          awards: [],
        },
      });
    });

    it('loai undefined de PATCH tung phan khong ghi de field khong gui', async () => {
      const dto = {
        firstname: 'Nguyen',
        lastname: 'Van A',
        education: undefined,
        technicalSkills: [{ name: 'Go' }],
      };
      mockPrisma.userProfile.upsert.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(BASE_USER);

      await service.upsertProfile('user-123', dto);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { firstname: 'Nguyen', lastname: 'Van A' },
      });
      const expectedPatch = {
        technicalSkills: [{ name: 'Go' }],
      };
      expect(mockPrisma.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        create: { ...expectedPatch, userId: 'user-123' },
        update: expectedPatch,
      });
    });
  });
});
