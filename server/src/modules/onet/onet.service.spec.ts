import { Test, TestingModule } from '@nestjs/testing';
import { OnetService } from './onet.service';
import {
  IOnetRepository,
  ONET_REPOSITORY_TOKEN,
} from './domain/onet-repository.interface';
import { OnetOccupationDto, OnetTechDto } from './contracts/onet.dto';

describe('OnetService', () => {
  let service: OnetService;
  let repository: jest.Mocked<IOnetRepository>;

  const mockOccupations: OnetOccupationDto[] = [
    {
      socCode: '15-1252.00',
      title: 'Software Developers',
      description: 'Design and develop software',
      matchedTitle: 'Software Developers',
      similarityScore: 1.0,
    },
  ];

  const mockTechnologies: OnetTechDto[] = [
    {
      example: 'TypeScript',
      isHotTechnology: true,
      inDemand: true,
    },
    {
      example: 'PostgreSQL',
      isHotTechnology: true,
      inDemand: false,
    },
  ];

  beforeEach(async () => {
    const mockRepository: jest.Mocked<IOnetRepository> = {
      findExactOccupationByTitle: jest.fn(),
      findFuzzyAlternateTitles: jest.fn(),
      findFuzzyOccupationData: jest.fn(),
      getOccupationBySocCode: jest.fn(),
      getToolsAndTechnology: jest.fn().mockResolvedValue(mockTechnologies),
      getDefaultOccupations: jest.fn().mockResolvedValue(mockOccupations),
      searchOccupationsWithScores: jest.fn().mockResolvedValue(mockOccupations),
      searchTechnologies: jest.fn().mockResolvedValue(mockTechnologies),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnetService,
        {
          provide: ONET_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OnetService>(OnetService);
    repository = module.get(ONET_REPOSITORY_TOKEN);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchTechnologies', () => {
    it('delegates trimmed query and clamped limit to repository', async () => {
      const result = await service.searchTechnologies('  TypeScript  ', 25);

      expect(repository.searchTechnologies).toHaveBeenCalledWith(
        'TypeScript',
        25,
      );
      expect(result).toEqual(mockTechnologies);
    });

    it('passes undefined query and default limit 30 when query is blank', async () => {
      const result = await service.searchTechnologies('   ');

      expect(repository.searchTechnologies).toHaveBeenCalledWith(undefined, 30);
      expect(result).toEqual(mockTechnologies);
    });

    it('clamps limit to [1..100]', async () => {
      await service.searchTechnologies('React', 500);
      expect(repository.searchTechnologies).toHaveBeenLastCalledWith(
        'React',
        100,
      );

      await service.searchTechnologies('React', -5);
      expect(repository.searchTechnologies).toHaveBeenLastCalledWith(
        'React',
        1,
      );
    });

    it('returns empty array on repository error', async () => {
      repository.searchTechnologies.mockRejectedValueOnce(
        new Error('DB connection lost'),
      );

      const result = await service.searchTechnologies('React', 20);
      expect(result).toEqual([]);
    });
  });

  describe('searchOccupations', () => {
    it('returns default occupations when query is empty', async () => {
      const result = await service.searchOccupations('', 10);

      expect(repository.getDefaultOccupations).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockOccupations);
    });
  });
});
