import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { OnetRepository } from './onet.repository';
import {
  IOnetRepository,
  ONET_REPOSITORY_TOKEN,
} from '../domain/onet-repository.interface';

describe('OnetRepository', () => {
  let repository: IOnetRepository;
  let queryRawMock: jest.Mock;

  const mockOccupationRow = {
    socCode: '15-1252.00',
    title: 'Software Developers',
    description: 'Research and develop software.',
    matchedTitle: 'Software Developers',
    similarityScore: 1.0,
  };

  const mockTechRows = [
    {
      example: 'Docker',
      isHotTechnology: true,
      inDemand: true,
    },
  ];

  beforeEach(async () => {
    queryRawMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnetRepository,
        {
          provide: ONET_REPOSITORY_TOKEN,
          useExisting: OnetRepository,
        },
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: queryRawMock,
          },
        },
      ],
    }).compile();

    repository = module.get<IOnetRepository>(ONET_REPOSITORY_TOKEN);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findExactOccupationByTitle', () => {
    it('returns mapped occupation if found', async () => {
      queryRawMock.mockResolvedValueOnce([mockOccupationRow]);
      const result = await repository.findExactOccupationByTitle(
        'Software Developers',
      );
      expect(result).toEqual(mockOccupationRow);
    });

    it('returns null if not found', async () => {
      queryRawMock.mockResolvedValueOnce([]);
      const result = await repository.findExactOccupationByTitle('Unknown');
      expect(result).toBeNull();
    });

    it('throws error when query fails', async () => {
      queryRawMock.mockRejectedValueOnce(new Error('Query error'));
      await expect(
        repository.findExactOccupationByTitle('Error'),
      ).rejects.toThrow('Query error');
    });
  });

  describe('findFuzzyAlternateTitles', () => {
    it('returns fuzzy match from alternate titles', async () => {
      queryRawMock.mockResolvedValueOnce([mockOccupationRow]);
      const result =
        await repository.findFuzzyAlternateTitles('Full Stack Dev');
      expect(result).toEqual(mockOccupationRow);
    });
  });

  describe('findFuzzyOccupationData', () => {
    it('returns fuzzy match from occupation data', async () => {
      queryRawMock.mockResolvedValueOnce([mockOccupationRow]);
      const result = await repository.findFuzzyOccupationData('Software Dev');
      expect(result).toEqual(mockOccupationRow);
    });
  });

  describe('getOccupationBySocCode', () => {
    it('returns occupation for valid socCode', async () => {
      queryRawMock.mockResolvedValueOnce([mockOccupationRow]);
      const result = await repository.getOccupationBySocCode('15-1252.00');
      expect(result).toEqual(mockOccupationRow);
    });
  });

  describe('getToolsAndTechnology', () => {
    it('returns mapped tech skills', async () => {
      queryRawMock.mockResolvedValueOnce(mockTechRows);
      const result = await repository.getToolsAndTechnology('15-1252.00');
      expect(result).toEqual([
        {
          example: 'Docker',
          isHotTechnology: true,
          inDemand: true,
        },
      ]);
    });
  });

  describe('getDefaultOccupations', () => {
    it('returns default occupations list', async () => {
      queryRawMock.mockResolvedValueOnce([mockOccupationRow]);
      const result = await repository.getDefaultOccupations(5);
      expect(result).toEqual([mockOccupationRow]);
    });
  });

  describe('searchOccupationsWithScores', () => {
    it('returns search results with similarity scores', async () => {
      queryRawMock.mockResolvedValueOnce([mockOccupationRow]);
      const result = await repository.searchOccupationsWithScores(
        'developer',
        '%developer%',
        5,
      );
      expect(result).toEqual([mockOccupationRow]);
    });
  });
});
