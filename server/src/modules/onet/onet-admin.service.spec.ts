import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OnetAdminService } from './onet-admin.service';
import {
  IOnetAdminRepository,
  ONET_ADMIN_REPOSITORY_TOKEN,
} from './domain/onet-admin-repository.interface';
import { SFIA_FACADE_TOKEN } from '@modules/sfia/contracts/sfia.facade.interface';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';

describe('OnetAdminService', () => {
  let service: OnetAdminService;

  const mockAdminRepo: Partial<IOnetAdminRepository> = {
    getSystemSummary: jest.fn().mockResolvedValue({
      totalOccupations: 1000,
      totalMajorGroups: 23,
      totalMappedOccupations: 500,
      itGroupOccupations: 100,
      itGroupMappedOccupations: 80,
      totalSoftwareSkills: 5000,
      hotTechCount: 400,
      inDemandTechCount: 600,
      totalAlternateTitles: 54000,
      totalMockInterviews: 120,
      totalLinkedJobDescriptions: 45,
    }),
    getMajorGroupsDistribution: jest
      .fn()
      .mockResolvedValue([
        { code: '15', totalOccupations: 100, mappedOccupations: 80 },
      ]),
    searchSidebarOccupations: jest.fn().mockResolvedValue([
      {
        socCode: '15-1252.00',
        title: 'Software Developers',
        majorGroupCode: '15',
        isMapped: true,
        mappingCount: 5,
      },
    ]),
    getTopOccupations: jest.fn().mockResolvedValue([
      {
        socCode: '15-1252.00',
        title: 'Software Developers',
        majorGroupCode: '15',
        mockInterviewCount: 50,
        jobDescriptionCount: 20,
        mappingCount: 5,
        isMapped: true,
        coreSkillCodes: ['PROG'],
      },
    ]),
    getSfiaSkillCoverage: jest.fn().mockResolvedValue([
      {
        code: 'PROG',
        mappedOccupationsCount: 15,
        coreCount: 10,
        secondaryCount: 5,
        minTargetLevel: 1,
        maxTargetLevel: 6,
        avgTargetLevel: 3.5,
      },
    ]),
    getOccupationBaseDetail: jest.fn().mockResolvedValue({
      socCode: '15-1252.00',
      title: 'Software Developers',
      description: 'Research and develop software.',
    }),
    getOccupationJobZone: jest.fn().mockResolvedValue({
      zone: 4,
      name: 'Considerable Preparation Needed',
      education: 'Bachelor',
      experience: '4y',
      jobTraining: 'None',
    }),
    getOccupationStatsCounts: jest.fn().mockResolvedValue({
      toolCount: 10,
      taskCount: 8,
      mappingCount: 5,
      alternateTitleCount: 30,
    }),
    getOccupationTechSkills: jest.fn().mockResolvedValue([
      {
        name: 'Docker',
        category: 'DevOps',
        isHotTechnology: true,
        inDemand: true,
      },
    ]),
    getOccupationTasks: jest
      .fn()
      .mockResolvedValue([
        { id: 1, statement: 'Develop software', isCore: true },
      ]),
    getAlternateTitlesCount: jest.fn().mockResolvedValue(30),
    getAlternateTitlesPaginated: jest
      .fn()
      .mockResolvedValue(['Full Stack Engineer', 'Backend Dev']),
    getOccupationSfiaMappings: jest.fn().mockResolvedValue([
      {
        id: 'map_1',
        onetSocCode: '15-1252.00',
        sfiaSkillCode: 'PROG',
        targetSfiaLevel: 3,
        defaultWeight: 1.0,
        isCore: true,
        source: 'EXPERT_CURATED',
        createdAt: new Date(),
      },
    ]),
    findSfiaMappingById: jest.fn().mockResolvedValue({
      id: 'map_1',
      onetSocCode: '15-1252.00',
      sfiaSkillCode: 'PROG',
      targetSfiaLevel: 3,
      defaultWeight: 1.0,
      isCore: true,
      source: 'EXPERT_CURATED',
      createdAt: new Date(),
    }),
    findSfiaMappingByUnique: jest.fn().mockResolvedValue(null),
    createSfiaMapping: jest.fn().mockResolvedValue({
      id: 'map_new',
      onetSocCode: '15-1252.00',
      sfiaSkillCode: 'TEST',
      targetSfiaLevel: 2,
      defaultWeight: 1.0,
      isCore: false,
      source: 'USER_DEFINED',
      createdAt: new Date(),
    }),
    updateSfiaMapping: jest.fn().mockResolvedValue({
      id: 'map_1',
      onetSocCode: '15-1252.00',
      sfiaSkillCode: 'PROG',
      targetSfiaLevel: 4,
      defaultWeight: 1.5,
      isCore: true,
      source: 'EXPERT_CURATED',
      createdAt: new Date(),
    }),
    deleteSfiaMapping: jest.fn().mockResolvedValue(true),
    deleteOccupationMappings: jest.fn().mockResolvedValue(1),
    resetUserDefinedMappings: jest.fn().mockResolvedValue([
      {
        id: 'map_1',
        onetSocCode: '15-1252.00',
        sfiaSkillCode: 'PROG',
        targetSfiaLevel: 3,
        defaultWeight: 1.0,
        isCore: true,
        source: 'EXPERT_CURATED',
        createdAt: new Date(),
      },
    ]),
  };

  const mockSfiaFacade = {
    getSkillByCode: jest.fn().mockResolvedValue({
      code: 'PROG',
      name: 'Software Development',
      categoryCode: 'DEV_IMPL',
      categoryName: 'Phát triển & Triển khai',
      minLevel: 2,
      maxLevel: 6,
      levelDescriptions: {
        3: 'Thiết kế, viết mã và kiểm thử các module phần mềm vừa phải.',
        4: 'Designs, codes, verifies, tests complex programs.',
      },
    }),
    getLevel: jest.fn().mockResolvedValue({
      levelId: 3,
      name: 'Apply',
      nameVi: 'Áp dụng độc lập',
      essence: 'Works under general direction.',
      description: 'Generic level 3 responsibility.',
    }),
    getAllLevels: jest.fn().mockResolvedValue([
      {
        levelId: 3,
        name: 'Apply',
        nameVi: 'Áp dụng độc lập',
        essence: 'Works under general direction.',
        description: 'Applies knowledge.',
      },
    ]),
    getAllSkills: jest.fn().mockResolvedValue([
      {
        code: 'PROG',
        name: 'Software Development',
        categoryCode: 'DEV_IMPL',
        categoryName: 'Phát triển & Triển khai',
        overallDescription: 'Designing and building software.',
        minLevel: 1,
        maxLevel: 6,
        levelDescriptions: {
          4: 'Designs, codes, verifies, tests complex programs.',
        },
      },
    ]),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnetAdminService,
        {
          provide: ONET_ADMIN_REPOSITORY_TOKEN,
          useValue: mockAdminRepo,
        },
        {
          provide: SFIA_FACADE_TOKEN,
          useValue: mockSfiaFacade,
        },
      ],
    }).compile();

    service = module.get<OnetAdminService>(OnetAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAnalyticsSummary', () => {
    it('returns calculated analytics summary', async () => {
      const result = await service.getAnalyticsSummary();
      expect(result.totalOccupations).toBe(1000);
      expect(result.overallMappingCoveragePercent).toBe(50.0);
      expect(result.itGroupCoveragePercent).toBe(80.0);
    });
  });

  describe('getMajorGroupsDistribution', () => {
    it('returns major groups with real bilingual names and coverage percentages', async () => {
      const result = await service.getMajorGroupsDistribution();
      expect(result.length).toBe(1);
      const itGroup = result.find((g) => g.code === '15');
      expect(itGroup?.isFocusGroup).toBe(true);
      expect(itGroup?.name).toBe('Máy tính & Toán học');
      expect(itGroup?.englishName).toBe(
        'Computer and Mathematical Occupations',
      );
      expect(itGroup?.totalOccupations).toBe(100);
      expect(itGroup?.mappingCoveragePercent).toBe(80.0);
    });
  });

  describe('searchOccupations', () => {
    it('forwards mappingStatus unmapped and lifts group limit up to 500', async () => {
      const result = await service.searchOccupations({
        groupCode: '15',
        mappingStatus: 'unmapped',
        limit: 300,
      });
      expect(result).toHaveLength(1);
      expect(mockAdminRepo.searchSidebarOccupations).toHaveBeenCalledWith(
        '15',
        'unmapped',
        undefined,
        300,
      );
    });

    it('preserves backwards compatibility for mappedOnly: true -> mappingStatus: mapped', async () => {
      const result = await service.searchOccupations({ mappedOnly: true });
      expect(result).toHaveLength(1);
      expect(mockAdminRepo.searchSidebarOccupations).toHaveBeenCalledWith(
        undefined,
        'mapped',
        undefined,
        50,
      );
    });
  });

  describe('getTopOccupations', () => {
    it('forwards groupCode and returns real major group names', async () => {
      const result = await service.getTopOccupations({
        sortBy: 'interviews',
        limit: 5,
        groupCode: '15',
      });
      expect(result).toHaveLength(1);
      expect(result[0].majorGroupName).toBe('Máy tính & Toán học');
      expect(mockAdminRepo.getTopOccupations).toHaveBeenCalledWith(
        undefined,
        'interviews',
        5,
        '15',
      );
    });
  });

  describe('getSfiaSkillCoverage', () => {
    it('enriches coverage items with SFIA Facade metadata and filters category BEFORE slicing to limit', async () => {
      (mockAdminRepo.getSfiaSkillCoverage as jest.Mock).mockResolvedValueOnce([
        {
          code: 'GOVN',
          mappedOccupationsCount: 40,
          coreCount: 30,
          secondaryCount: 10,
          minTargetLevel: 5,
          maxTargetLevel: 7,
          avgTargetLevel: 6.0,
        },
        {
          code: 'PROG',
          mappedOccupationsCount: 25,
          coreCount: 20,
          secondaryCount: 5,
          minTargetLevel: 2,
          maxTargetLevel: 6,
          avgTargetLevel: 3.8,
        },
        {
          code: 'SCTY',
          mappedOccupationsCount: 22,
          coreCount: 15,
          secondaryCount: 7,
          minTargetLevel: 3,
          maxTargetLevel: 6,
          avgTargetLevel: 4.5,
        },
        {
          code: 'TEST',
          mappedOccupationsCount: 18,
          coreCount: 12,
          secondaryCount: 6,
          minTargetLevel: 1,
          maxTargetLevel: 6,
          avgTargetLevel: 3.2,
        },
      ]);
      mockSfiaFacade.getAllSkills.mockResolvedValueOnce([
        {
          code: 'GOVN',
          name: 'Governance',
          categoryCode: 'STRAT_ARCH',
          categoryName: 'Chiến lược & Kiến trúc',
          overallDescription: 'Governance',
          minLevel: 5,
          maxLevel: 7,
        },
        {
          code: 'PROG',
          name: 'Software Development',
          categoryCode: 'DEV_IMPL',
          categoryName: 'Phát triển & Triển khai',
          overallDescription: 'Programming',
          minLevel: 2,
          maxLevel: 6,
        },
        {
          code: 'SCTY',
          name: 'Information Security',
          categoryCode: 'DELIV_OPS',
          categoryName: 'Vận hành & Triển khai',
          overallDescription: 'Security',
          minLevel: 3,
          maxLevel: 6,
        },
        {
          code: 'TEST',
          name: 'Functional Testing',
          categoryCode: 'DEV_IMPL',
          categoryName: 'Phát triển & Triển khai',
          overallDescription: 'Testing',
          minLevel: 1,
          maxLevel: 6,
        },
      ]);

      const result = await service.getSfiaSkillCoverage(2, 'DEV_IMPL');

      expect(mockAdminRepo.getSfiaSkillCoverage).toHaveBeenCalledWith(
        undefined,
      );
      expect(result).toHaveLength(2);
      expect(result.map((item) => item.code)).toEqual(['PROG', 'TEST']);
      expect(result[0].category).toBe('Phát triển & Triển khai');
      expect(result[1].category).toBe('Phát triển & Triển khai');
    });
  });

  describe('getOccupationDetail', () => {
    it('returns comprehensive occupation detail', async () => {
      const result = await service.getOccupationDetail('15-1252.00');
      expect(result.socCode).toBe('15-1252.00');
      expect(result.isMapped).toBe(true);
      expect(result.jobZone.zone).toBe(4);
      expect(result.softwareSkills).toHaveLength(1);
      expect(result.tasks).toHaveLength(1);
      expect(result.alternateTitles).toEqual([
        'Full Stack Engineer',
        'Backend Dev',
      ]);
    });

    it('throws InterviewAIException when socCode is empty', async () => {
      await expect(service.getOccupationDetail('')).rejects.toThrow(
        InterviewAIException,
      );
    });

    it('throws not found exception when base detail is null', async () => {
      (
        mockAdminRepo.getOccupationBaseDetail as jest.Mock
      ).mockResolvedValueOnce(null);
      await expect(service.getOccupationDetail('99-9999.00')).rejects.toThrow(
        InterviewAIException,
      );
    });
  });

  describe('SFIA Mapping CRUD', () => {
    it('returns sfia mappings with real categoryName and levelDescriptions', async () => {
      const result = await service.getOccupationSfiaMappings('15-1252.00');
      expect(result).toHaveLength(1);
      expect(result[0].sfiaSkillCode).toBe('PROG');
      expect(result[0].skillCategory).toBe('Phát triển & Triển khai');
      expect(result[0].responsibility).toBe(
        'Thiết kế, viết mã và kiểm thử các module phần mềm vừa phải.',
      );
      expect(result[0].minLevel).toBe(2);
      expect(result[0].maxLevel).toBe(6);
    });

    it('falls back to sfiaFacade.getLevel when levelDescriptions lacks target level', async () => {
      mockSfiaFacade.getSkillByCode.mockResolvedValueOnce({
        code: 'PROG',
        name: 'Software Development',
        categoryCode: 'DEV_IMPL',
        categoryName: undefined,
        minLevel: 2,
        maxLevel: 6,
        levelDescriptions: {},
      });

      const result = await service.getOccupationSfiaMappings('15-1252.00');
      expect(result[0].skillCategory).toBe('DEV_IMPL');
      expect(result[0].responsibility).toBe('Generic level 3 responsibility.');
      expect(mockSfiaFacade.getLevel).toHaveBeenCalledWith(3);
    });

    it('creates sfia mapping successfully', async () => {
      const result = await service.createSfiaMapping('15-1252.00', {
        sfiaSkillCode: 'PROG',
        targetSfiaLevel: 3,
        defaultWeight: 1.0,
      });
      expect(result.id).toBeDefined();
      expect(result.skillCategory).toBe('Phát triển & Triển khai');
    });

    it('updates sfia mapping successfully', async () => {
      const result = await service.updateSfiaMapping('15-1252.00', 'map_1', {
        targetSfiaLevel: 4,
        defaultWeight: 1.5,
      });
      expect(result.targetSfiaLevel).toBe(4);
      expect(result.skillCategory).toBe('Phát triển & Triển khai');
    });

    it('rejects updateSfiaMapping when targetSfiaLevel is below minLevel or above maxLevel', async () => {
      await expect(
        service.updateSfiaMapping('15-1252.00', 'map_1', {
          targetSfiaLevel: 1,
        }),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.VALIDATION_ERROR,
        status: HttpStatus.BAD_REQUEST,
      });

      await expect(
        service.updateSfiaMapping('15-1252.00', 'map_1', {
          targetSfiaLevel: 7,
        }),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.VALIDATION_ERROR,
        status: HttpStatus.BAD_REQUEST,
      });

      expect(mockAdminRepo.updateSfiaMapping).not.toHaveBeenCalled();
    });

    it('deletes sfia mapping successfully', async () => {
      const result = await service.deleteSfiaMapping('15-1252.00', 'map_1');
      expect(result.success).toBe(true);
    });

    it('resets USER_DEFINED sfia mappings via repository transaction without redundant DB fetch', async () => {
      const result = await service.resetSfiaMappings('15-1252.00');
      expect(mockAdminRepo.resetUserDefinedMappings).toHaveBeenCalledWith(
        '15-1252.00',
      );
      expect(mockAdminRepo.getOccupationSfiaMappings).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].skillCategory).toBe('Phát triển & Triển khai');
    });

    it('returns real level descriptions in getSfiaLibrary', async () => {
      const library = await service.getSfiaLibrary();
      expect(library).toHaveLength(1);
      expect(library[0].category).toBe('Phát triển & Triển khai');
      const level4 = library[0].levels.find((l) => l.level === 4);
      expect(level4?.description).toContain('complex programs');
    });
  });
});
