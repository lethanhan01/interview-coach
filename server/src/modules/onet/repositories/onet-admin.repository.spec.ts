import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { OnetAdminRepository } from './onet-admin.repository';
import {
  IOnetAdminRepository,
  ONET_ADMIN_REPOSITORY_TOKEN,
} from '../domain/onet-admin-repository.interface';

describe('OnetAdminRepository', () => {
  let repository: IOnetAdminRepository;
  let queryRawMock: jest.Mock;
  let queryRawUnsafeMock: jest.Mock;

  beforeEach(async () => {
    queryRawMock = jest.fn();
    queryRawUnsafeMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnetAdminRepository,
        {
          provide: ONET_ADMIN_REPOSITORY_TOKEN,
          useExisting: OnetAdminRepository,
        },
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: queryRawMock,
            $queryRawUnsafe: queryRawUnsafeMock,
          },
        },
      ],
    }).compile();

    repository = module.get<IOnetAdminRepository>(ONET_ADMIN_REPOSITORY_TOKEN);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getSystemSummary', () => {
    it('returns summary statistics from database', async () => {
      const mockSummary = {
        totalOccupations: 100,
        totalMajorGroups: 23,
        totalMappedOccupations: 50,
        itGroupOccupations: 20,
        itGroupMappedOccupations: 15,
        totalSoftwareSkills: 500,
        hotTechCount: 50,
        inDemandTechCount: 80,
        totalAlternateTitles: 1000,
        totalMockInterviews: 30,
        totalLinkedJobDescriptions: 25,
      };

      queryRawMock.mockResolvedValueOnce([mockSummary]);
      const result = await repository.getSystemSummary();
      expect(result).toEqual(mockSummary);
    });
  });

  describe('getMajorGroupsDistribution', () => {
    it('returns major groups distribution', async () => {
      const mockGroups = [
        { code: '15', totalOccupations: 30, mappedOccupations: 25 },
      ];
      queryRawMock.mockResolvedValueOnce(mockGroups);

      const result = await repository.getMajorGroupsDistribution();
      expect(result).toEqual(mockGroups);
    });
  });

  describe('searchSidebarOccupations', () => {
    it('returns sidebar occupations matching criteria', async () => {
      const mockSidebar = [
        {
          socCode: '15-1252.00',
          title: 'Software Developers',
          majorGroupCode: '15',
          isMapped: true,
          mappingCount: 5,
        },
      ];
      queryRawMock.mockResolvedValueOnce(mockSidebar);

      const result = await repository.searchSidebarOccupations(
        '15',
        true,
        'developer',
        10,
      );
      expect(result).toEqual(mockSidebar);
    });
  });

  describe('getTopOccupations', () => {
    it('returns top occupations', async () => {
      const mockTop = [
        {
          socCode: '15-1252.00',
          title: 'Software Developers',
          majorGroupCode: '15',
          mockInterviewCount: 10,
          jobDescriptionCount: 5,
          mappingCount: 2,
          isMapped: true,
          coreSkillCodes: ['PROG'],
        },
      ];
      queryRawMock.mockResolvedValueOnce(mockTop);

      const result = await repository.getTopOccupations('dev', 'interviews', 5);
      expect(result).toEqual(mockTop);
    });
  });

  describe('getSfiaSkillCoverage', () => {
    it('returns sfia skill coverage rows', async () => {
      const mockCoverage = [
        {
          code: 'PROG',
          mappedOccupationsCount: 10,
          coreCount: 8,
          secondaryCount: 2,
          minTargetLevel: 1,
          maxTargetLevel: 6,
          avgTargetLevel: 3.5,
        },
      ];
      queryRawMock.mockResolvedValueOnce(mockCoverage);

      const result = await repository.getSfiaSkillCoverage(10);
      expect(result).toEqual(mockCoverage);
    });
  });

  describe('getOccupationBaseDetail & JobZone & Stats', () => {
    it('returns occupation base detail', async () => {
      const mockDetail = {
        socCode: '15-1252.00',
        title: 'Software Developers',
        description: 'Desc',
      };
      queryRawMock.mockResolvedValueOnce([mockDetail]);

      const result = await repository.getOccupationBaseDetail('15-1252.00');
      expect(result).toEqual(mockDetail);
    });

    it('returns occupation job zone', async () => {
      const mockJobZone = {
        zone: 4,
        name: 'Zone 4',
        education: 'BS',
        experience: '4y',
        jobTraining: 'None',
      };
      queryRawMock.mockResolvedValueOnce([mockJobZone]);

      const result = await repository.getOccupationJobZone('15-1252.00');
      expect(result).toEqual(mockJobZone);
    });

    it('returns occupation stats counts', async () => {
      const mockCounts = {
        toolCount: 5,
        taskCount: 10,
        mappingCount: 2,
        alternateTitleCount: 20,
      };
      queryRawMock.mockResolvedValueOnce([mockCounts]);

      const result = await repository.getOccupationStatsCounts('15-1252.00');
      expect(result).toEqual(mockCounts);
    });
  });

  describe('getOccupationTechSkills & Tasks', () => {
    it('returns tech skills', async () => {
      const mockTech = [
        {
          name: 'Docker',
          category: 'DevOps',
          isHotTechnology: true,
          inDemand: true,
        },
      ];
      queryRawMock.mockResolvedValueOnce(mockTech);

      const result = await repository.getOccupationTechSkills('15-1252.00');
      expect(result).toEqual(mockTech);
    });

    it('returns tasks', async () => {
      const mockTasks = [{ id: 1, statement: 'Write code', isCore: true }];
      queryRawMock.mockResolvedValueOnce(mockTasks);

      const result = await repository.getOccupationTasks('15-1252.00');
      expect(result).toEqual(mockTasks);
    });
  });

  describe('getAlternateTitlesPaginated & Count', () => {
    it('returns alternate titles count', async () => {
      queryRawMock.mockResolvedValueOnce([{ count: 15 }]);
      const count = await repository.getAlternateTitlesCount(
        '15-1252.00',
        'dev',
      );
      expect(count).toBe(15);
    });

    it('returns paginated alternate titles', async () => {
      queryRawMock.mockResolvedValueOnce([
        { job_title: 'Full Stack Dev' },
      ]);
      const titles = await repository.getAlternateTitlesPaginated(
        '15-1252.00',
        'dev',
        10,
        0,
      );
      expect(titles).toEqual(['Full Stack Dev']);
    });
  });
});
