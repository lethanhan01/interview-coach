import { Test, TestingModule } from '@nestjs/testing';
import { CandidateProfileService } from './candidate-profile.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import {
  createMockPrismaService,
  createMockUserFacade,
} from '@core/test-utils/mock-factories';
import { USER_FACADE_TOKEN } from '@modules/user/contracts/user.facade.interface';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { HttpStatus } from '@nestjs/common';

describe('CandidateProfileService', () => {
  let service: CandidateProfileService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockUserFacade: ReturnType<typeof createMockUserFacade>;

  const BASE_USER_ACCOUNT = {
    id: 'user-123',
    email: 'candidate@example.com',
    firstname: 'Van A',
    lastname: 'Nguyen',
    role: 'candidate',
    status: 'active',
    createdAt: new Date(),
  };

  const BASE_USER_PROFILE = {
    userId: 'user-123',
    targetPosition: 'Software Engineer',
    targetLevel: 'senior',
    onetSocCode: '15-1252.00',
    onetOccupationTitle: 'Software Developers',
    targetSfiaLevel: 4,
    personality: 'Proactive',
    education: { school: 'HUST' },
    workExperience: [{ company: 'Tech Corp' }],
    projects: [{ name: 'App' }],
    technicalSkills: [{ name: 'TypeScript' }],
    certifications: [{ name: 'AWS' }],
    awards: [{ name: 'Best Performer' }],
  };

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockUserFacade = createMockUserFacade();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateProfileService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: USER_FACADE_TOKEN, useValue: mockUserFacade },
      ],
    }).compile();

    service = module.get<CandidateProfileService>(CandidateProfileService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getProfile', () => {
    it('returns combined user and profile details when found', async () => {
      mockUserFacade.getUserAccount.mockResolvedValue(BASE_USER_ACCOUNT);
      mockPrisma.userProfile.findUnique.mockResolvedValue(BASE_USER_PROFILE);

      const result = await service.getProfile('user-123');

      expect(mockUserFacade.getUserAccount).toHaveBeenCalledWith('user-123');
      expect(mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        select: expect.any(Object),
      });

      expect(result).toEqual({
        id: BASE_USER_ACCOUNT.id,
        email: BASE_USER_ACCOUNT.email,
        firstname: BASE_USER_ACCOUNT.firstname,
        lastname: BASE_USER_ACCOUNT.lastname,
        profile: {
          targetPosition: BASE_USER_PROFILE.targetPosition,
          targetLevel: BASE_USER_PROFILE.targetLevel,
          onetSocCode: BASE_USER_PROFILE.onetSocCode,
          onetOccupationTitle: BASE_USER_PROFILE.onetOccupationTitle,
          targetSfiaLevel: BASE_USER_PROFILE.targetSfiaLevel,
          personality: BASE_USER_PROFILE.personality,
          education: BASE_USER_PROFILE.education,
          workExperience: BASE_USER_PROFILE.workExperience,
          projects: BASE_USER_PROFILE.projects,
          technicalSkills: BASE_USER_PROFILE.technicalSkills,
          certifications: BASE_USER_PROFILE.certifications,
          awards: BASE_USER_PROFILE.awards,
        },
      });
    });

    it('returns profile as null if user has no profile record yet', async () => {
      mockUserFacade.getUserAccount.mockResolvedValue(BASE_USER_ACCOUNT);
      mockPrisma.userProfile.findUnique.mockResolvedValue(null);

      const result = await service.getProfile('user-123');

      expect(result.profile).toBeNull();
      expect(result.email).toBe(BASE_USER_ACCOUNT.email);
    });

    it('throws error when user does not exist via UserFacade', async () => {
      mockUserFacade.getUserAccount.mockRejectedValue(
        new InterviewAIException(
          ErrorCode.USER_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'User not found',
        ),
      );

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        InterviewAIException,
      );
    });
  });

  describe('upsertProfile', () => {
    it('upserts candidate profile data and returns updated profile', async () => {
      mockUserFacade.getUserAccount.mockResolvedValue(BASE_USER_ACCOUNT);
      mockPrisma.userProfile.upsert.mockResolvedValue({});
      mockPrisma.userProfile.findUnique.mockResolvedValue(BASE_USER_PROFILE);

      const dto = {
        targetPosition: 'Software Engineer',
        targetLevel: 'senior',
        technicalSkills: [{ name: 'TypeScript' }],
      };

      const result = await service.upsertProfile('user-123', dto);

      expect(mockUserFacade.getUserAccount).toHaveBeenCalledWith('user-123');
      expect(mockPrisma.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        create: {
          targetPosition: 'Software Engineer',
          targetLevel: 'senior',
          technicalSkills: [{ name: 'TypeScript' }],
          userId: 'user-123',
        },
        update: {
          targetPosition: 'Software Engineer',
          targetLevel: 'senior',
          technicalSkills: [{ name: 'TypeScript' }],
        },
      });
      expect(result.id).toBe('user-123');
    });

    it('strips undefined properties during partial update', async () => {
      mockUserFacade.getUserAccount.mockResolvedValue(BASE_USER_ACCOUNT);
      mockPrisma.userProfile.upsert.mockResolvedValue({});
      mockPrisma.userProfile.findUnique.mockResolvedValue(BASE_USER_PROFILE);

      const dto = {
        targetPosition: 'Lead Engineer',
        targetLevel: undefined,
      };

      await service.upsertProfile('user-123', dto);

      expect(mockPrisma.userProfile.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        create: {
          targetPosition: 'Lead Engineer',
          userId: 'user-123',
        },
        update: {
          targetPosition: 'Lead Engineer',
        },
      });
    });
  });
});
