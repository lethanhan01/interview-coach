import { Test, TestingModule } from '@nestjs/testing';
import { OnetAdminController } from './onet-admin.controller';
import { OnetAdminService } from './onet-admin.service';
import { JwtAuthGuard, RolesGuard } from '@core/common/guards';

describe('OnetAdminController', () => {
  let controller: OnetAdminController;
  let service: OnetAdminService;

  const mockAnalyticsSummary = {
    totalOccupations: 1016,
    totalMajorGroups: 23,
    totalMappedOccupations: 45,
    overallMappingCoveragePercent: 4.4,
    itGroupOccupations: 35,
    itGroupMappedOccupations: 28,
    itGroupCoveragePercent: 80.0,
    totalSoftwareSkills: 31821,
    hotTechCount: 450,
    inDemandTechCount: 1200,
    totalAlternateTitles: 54269,
    totalMockInterviews: 120,
    totalLinkedJobDescriptions: 85,
  };

  const mockMajorGroups = [
    {
      code: '15',
      name: 'Máy tính & Toán học',
      englishName: 'Computer and Mathematical Occupations',
      totalOccupations: 35,
      mappedOccupations: 28,
      mappingCoveragePercent: 80.0,
      isFocusGroup: true,
    },
  ];

  const mockTopOccupations = [
    {
      socCode: '15-1252.00',
      title: 'Software Developers',
      majorGroupCode: '15',
      majorGroupName: 'Máy tính & Toán học',
      mockInterviewCount: 42,
      jobDescriptionCount: 15,
      mappingCount: 8,
      isMapped: true,
      coreSkillCodes: ['PROG', 'TEST'],
    },
  ];

  const mockSfiaCoverage = [
    {
      code: 'PROG',
      name: 'Software Development',
      category: 'Software Engineering',
      mappedOccupationsCount: 18,
      coreCount: 14,
      secondaryCount: 4,
      minTargetLevel: 2,
      maxTargetLevel: 6,
      avgTargetLevel: 3.8,
    },
  ];

  const mockOccupationsSummary = [
    {
      socCode: '15-1252.00',
      title: 'Software Developers',
      majorGroupCode: '15',
      isMapped: true,
      mappingCount: 8,
    },
  ];

  const mockOccupationDetail = {
    socCode: '15-1252.00',
    title: 'Software Developers',
    description: 'Research, design, and develop computer and network software.',
    majorGroupCode: '15',
    isMapped: true,
    mappingCount: 8,
    jobZone: {
      zone: 4,
      name: 'Considerable Preparation Needed',
      education: "Bachelor's degree",
      experience: '2 to 4 years',
      jobTraining: 'Several months to a year',
    },
    stats: {
      toolCount: 120,
      taskCount: 25,
      mappingCount: 8,
      alternateTitleCount: 84,
    },
    tasks: [],
    softwareSkills: [],
    alternateTitles: [],
    sfiaMappings: [],
  };

  const mockAlternateTitles = {
    items: ['Full Stack Developer', 'Backend Engineer'],
    total: 84,
    page: 1,
    limit: 20,
    totalPages: 5,
  };

  const mockMappings = [
    {
      id: 'map_1',
      onetSocCode: '15-1252.00',
      sfiaSkillCode: 'PROG',
      skillName: 'Programming/software development',
      skillCategory: 'Software engineering',
      targetSfiaLevel: 3,
      defaultWeight: 1.5,
      isCore: true,
      source: 'EXPERT_CURATED',
      minLevel: 2,
      maxLevel: 6,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const mockSfiaLibrary = [
    {
      code: 'PROG',
      name: 'Programming/software development',
      category: 'Software engineering',
      categoryCode: 'SWEN',
      minLevel: 2,
      maxLevel: 6,
      description: 'The planning, designing, creation, testing...',
      levels: [
        {
          level: 2,
          description: 'Designs, codes, verifies, tests, amends...',
        },
      ],
    },
  ];

  const mockService = {
    getAnalyticsSummary: jest.fn().mockResolvedValue(mockAnalyticsSummary),
    getMajorGroupsDistribution: jest.fn().mockResolvedValue(mockMajorGroups),
    getTopOccupations: jest.fn().mockResolvedValue(mockTopOccupations),
    getSfiaSkillCoverage: jest.fn().mockResolvedValue(mockSfiaCoverage),
    searchOccupations: jest.fn().mockResolvedValue(mockOccupationsSummary),
    getOccupationDetail: jest.fn().mockResolvedValue(mockOccupationDetail),
    getOccupationAlternateTitles: jest
      .fn()
      .mockResolvedValue(mockAlternateTitles),
    getOccupationSfiaMappings: jest.fn().mockResolvedValue(mockMappings),
    createSfiaMapping: jest.fn().mockResolvedValue(mockMappings[0]),
    updateSfiaMapping: jest.fn().mockResolvedValue(mockMappings[0]),
    deleteSfiaMapping: jest
      .fn()
      .mockResolvedValue({ success: true, message: 'Deleted successfully' }),
    resetSfiaMappings: jest.fn().mockResolvedValue(mockMappings),
    getSfiaLibrary: jest.fn().mockResolvedValue(mockSfiaLibrary),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnetAdminController],
      providers: [
        {
          provide: OnetAdminService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OnetAdminController>(OnetAdminController);
    service = module.get<OnetAdminService>(OnetAdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('1. GET /onet/admin/analytics/summary', () => {
    it('returns macro analytics summary', async () => {
      const result = await controller.getAnalyticsSummary();
      expect(mockService.getAnalyticsSummary).toHaveBeenCalled();
      expect(result).toEqual(mockAnalyticsSummary);
    });
  });

  describe('2. GET /onet/admin/analytics/major-groups', () => {
    it('returns major groups distribution', async () => {
      const result = await controller.getMajorGroupsDistribution();
      expect(mockService.getMajorGroupsDistribution).toHaveBeenCalled();
      expect(result).toEqual(mockMajorGroups);
    });
  });

  describe('3. GET /onet/admin/analytics/top-occupations', () => {
    it('returns top occupations with query params', async () => {
      const query = { limit: 10, sortBy: 'interviews' as const };
      const result = await controller.getTopOccupations(query);
      expect(mockService.getTopOccupations).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockTopOccupations);
    });
  });

  describe('4. GET /onet/admin/analytics/sfia-coverage', () => {
    it('returns sfia skills coverage distribution', async () => {
      const result = await controller.getSfiaSkillCoverage(20, 'Software');
      expect(mockService.getSfiaSkillCoverage).toHaveBeenCalledWith(
        20,
        'Software',
      );
      expect(result).toEqual(mockSfiaCoverage);
    });
  });

  describe('5. GET /onet/admin/occupations', () => {
    it('searches occupations for sidebar', async () => {
      const query = { search: 'software', limit: 50 };
      const result = await controller.searchOccupations(query);
      expect(mockService.searchOccupations).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockOccupationsSummary);
    });
  });

  describe('6. GET /onet/admin/occupations/:socCode', () => {
    it('gets full occupation detail', async () => {
      const result = await controller.getOccupationDetail('15-1252.00');
      expect(mockService.getOccupationDetail).toHaveBeenCalledWith(
        '15-1252.00',
      );
      expect(result).toEqual(mockOccupationDetail);
    });
  });

  describe('7. GET /onet/admin/occupations/:socCode/alternate-titles', () => {
    it('gets paginated alternate titles', async () => {
      const query = { page: 1, limit: 20 };
      const result = await controller.getAlternateTitles('15-1252.00', query);
      expect(mockService.getOccupationAlternateTitles).toHaveBeenCalledWith(
        '15-1252.00',
        query,
      );
      expect(result).toEqual(mockAlternateTitles);
    });
  });

  describe('8. GET /onet/admin/occupations/:socCode/sfia-mappings', () => {
    it('gets sfia mappings for occupation', async () => {
      const result = await controller.getOccupationSfiaMappings('15-1252.00');
      expect(mockService.getOccupationSfiaMappings).toHaveBeenCalledWith(
        '15-1252.00',
      );
      expect(result).toEqual(mockMappings);
    });
  });

  describe('9. POST /onet/admin/occupations/:socCode/sfia-mappings', () => {
    it('creates sfia mapping', async () => {
      const dto = {
        sfiaSkillCode: 'PROG',
        targetSfiaLevel: 3,
        defaultWeight: 1.5,
        isCore: true,
      };
      const result = await controller.createSfiaMapping('15-1252.00', dto);
      expect(mockService.createSfiaMapping).toHaveBeenCalledWith(
        '15-1252.00',
        dto,
      );
      expect(result).toEqual(mockMappings[0]);
    });
  });

  describe('10. PATCH /onet/admin/occupations/:socCode/sfia-mappings/:mappingId', () => {
    it('updates sfia mapping', async () => {
      const dto = { targetSfiaLevel: 4, defaultWeight: 2.0 };
      const result = await controller.updateSfiaMapping(
        '15-1252.00',
        'map_1',
        dto,
      );
      expect(mockService.updateSfiaMapping).toHaveBeenCalledWith(
        '15-1252.00',
        'map_1',
        dto,
      );
      expect(result).toEqual(mockMappings[0]);
    });
  });

  describe('11. DELETE /onet/admin/occupations/:socCode/sfia-mappings/:mappingId', () => {
    it('deletes sfia mapping', async () => {
      const result = await controller.deleteSfiaMapping('15-1252.00', 'map_1');
      expect(mockService.deleteSfiaMapping).toHaveBeenCalledWith(
        '15-1252.00',
        'map_1',
      );
      expect(result).toEqual({
        success: true,
        message: 'Deleted successfully',
      });
    });
  });

  describe('12. POST /onet/admin/occupations/:socCode/sfia-mappings/reset', () => {
    it('resets sfia mappings to defaults', async () => {
      const result = await controller.resetSfiaMappings('15-1252.00');
      expect(mockService.resetSfiaMappings).toHaveBeenCalledWith('15-1252.00');
      expect(result).toEqual(mockMappings);
    });
  });

  describe('13. GET /onet/admin/sfia-library', () => {
    it('gets full sfia 9 library', async () => {
      const result = await controller.getSfiaLibrary();
      expect(mockService.getSfiaLibrary).toHaveBeenCalled();
      expect(result).toEqual(mockSfiaLibrary);
    });
  });
});
