import { Test, TestingModule } from '@nestjs/testing';
import { CandidateProfileController } from './candidate-profile.controller';
import { CandidateProfileService } from './candidate-profile.service';
import { JwtAuthGuard, RolesGuard } from '@core/common/guards';
import { createMockCandidateProfileService } from '@core/test-utils/mock-factories';

describe('CandidateProfileController', () => {
  let controller: CandidateProfileController;
  let mockCandidateProfileService: ReturnType<
    typeof createMockCandidateProfileService
  >;

  const mockReq = (userId = 'candidate-123') =>
    ({ user: { id: userId } }) as any;

  beforeEach(async () => {
    mockCandidateProfileService = createMockCandidateProfileService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidateProfileController],
      providers: [
        {
          provide: CandidateProfileService,
          useValue: mockCandidateProfileService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CandidateProfileController>(
      CandidateProfileController,
    );
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /candidate-profile', () => {
    it('calls candidateProfileService.getProfile with userId and returns profile', async () => {
      const candidateProfile = {
        id: 'candidate-123',
        email: 'cand@example.com',
        firstname: 'Van A',
        lastname: 'Nguyen',
        profile: {
          targetPosition: 'Software Engineer',
          targetLevel: 'senior',
        },
      };
      mockCandidateProfileService.getProfile.mockResolvedValue(
        candidateProfile as any,
      );

      const result = await controller.getProfile(mockReq());

      expect(result).toEqual(candidateProfile);
      expect(mockCandidateProfileService.getProfile).toHaveBeenCalledWith(
        'candidate-123',
      );
    });
  });

  describe('PATCH /candidate-profile', () => {
    it('calls candidateProfileService.upsertProfile with userId and dto', async () => {
      const dto = {
        targetPosition: 'Lead Engineer',
        technicalSkills: [{ name: 'TypeScript' }],
      };
      const updatedProfile = {
        id: 'candidate-123',
        email: 'cand@example.com',
        firstname: 'Van A',
        lastname: 'Nguyen',
        profile: {
          targetPosition: 'Lead Engineer',
          technicalSkills: [{ name: 'TypeScript' }],
        },
      };
      mockCandidateProfileService.upsertProfile.mockResolvedValue(
        updatedProfile as any,
      );

      const result = await controller.updateProfile(dto as any, mockReq());

      expect(result).toEqual(updatedProfile);
      expect(mockCandidateProfileService.upsertProfile).toHaveBeenCalledWith(
        'candidate-123',
        dto,
      );
    });

    it('propagates exception when candidateProfileService.upsertProfile throws', async () => {
      const dto = { targetPosition: 'Architect' };
      mockCandidateProfileService.upsertProfile.mockRejectedValue(
        new Error('DB Error'),
      );

      await expect(
        controller.updateProfile(dto as any, mockReq()),
      ).rejects.toThrow('DB Error');
    });
  });
});
