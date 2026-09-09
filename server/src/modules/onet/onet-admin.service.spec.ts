import { Test, TestingModule } from '@nestjs/testing';
import { OnetAdminService } from './onet-admin.service';
import {
  IOnetAdminRepository,
  ONET_ADMIN_REPOSITORY_TOKEN,
} from './domain/onet-admin-repository.interface';
import { SFIA_FACADE_TOKEN } from '@modules/sfia/contracts/sfia.facade.interface';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';

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
  };

  const mockSfiaFacade = {
    getSkillByCode: jest.fn().mockResolvedValue({
      code: 'PROG',
      name: 'Software Development',
      categoryCode: 'DEV_IMPL',
    }),
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
    it('returns major groups with coverage percentages', async () => {
      const result = await service.getMajorGroupsDistribution();
      expect(result.length).toBe(1);
      const itGroup = result.find((g) => g.code === '15');
      expect(itGroup?.isFocusGroup).toBe(true);
      expect(itGroup?.totalOccupations).toBe(100);
      expect(itGroup?.mappingCoveragePercent).toBe(80.0);
    });
  });

  describe('searchOccupations', () => {
    it('returns formatted sidebar occupations', async () => {
      const result = await service.searchOccupations({
        groupCode: '15',
        mappedOnly: true,
        limit: 10,
      });
      expect(result).toHaveLength(1);
      expect(result[0].socCode).toBe('15-1252.00');
    });
  });

  describe('getTopOccupations', () => {
    it('returns top occupations with major group names', async () => {
      const result = await service.getTopOccupations({
        sortBy: 'interviews',
        limit: 5,
      });
      expect(result).toHaveLength(1);
      expect(result[0].majorGroupName).toBeDefined();
    });
  });

  describe('getSfiaSkillCoverage', () => {
    it('enriches coverage items with SFIA Facade metadata', async () => {
      const result = await service.getSfiaSkillCoverage(10);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Software Development');
      expect(result[0].category).toBe('DEV_IMPL');
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
    it('returns sfia mappings for occupation', async () => {
      const result = await service.getOccupationSfiaMappings('15-1252.00');
      expect(result).toHaveLength(1);
      expect(result[0].sfiaSkillCode).toBe('PROG');
    });

    it('creates sfia mapping successfully', async () => {
      const result = await service.createSfiaMapping('15-1252.00', {
        sfiaSkillCode: 'PROG',
        targetSfiaLevel: 3,
        defaultWeight: 1.0,
      });
      expect(result.id).toBeDefined();
    });

    it('updates sfia mapping successfully', async () => {
      const result = await service.updateSfiaMapping('15-1252.00', 'map_1', {
        targetSfiaLevel: 4,
        defaultWeight: 1.5,
      });
      expect(result.targetSfiaLevel).toBe(4);
    });

    it('deletes sfia mapping successfully', async () => {
      const result = await service.deleteSfiaMapping('15-1252.00', 'map_1');
      expect(result.success).toBe(true);
    });

    it('resets sfia mappings', async () => {
      const result = await service.resetSfiaMappings('15-1252.00');
      expect(result).toHaveLength(1);
    });
  });
});
