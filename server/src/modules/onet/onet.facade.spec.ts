import { Test, TestingModule } from '@nestjs/testing';
import {
  ONET_FACADE_TOKEN,
  IOnetFacade,
} from './contracts/onet.facade.interface';
import {
  ONET_REPOSITORY_TOKEN,
  IOnetRepository,
} from './domain/onet-repository.interface';
import { OnetService, normalizeVietnameseJobTitle } from './onet.service';
import { OnetFacade } from './onet.facade';

describe('OnetFacade & OnetService', () => {
  let facade: IOnetFacade;
  let service: OnetService;

  const mockOccupation = {
    socCode: '15-1252.00',
    title: 'Software Developers',
    description: 'Research, design, and develop computer and network software.',
    matchedTitle: 'Software Developers',
    similarityScore: 1.0,
  };

  const mockFuzzyAlternateMatch = {
    socCode: '15-1252.00',
    title: 'Software Developers',
    description: 'Research, design, and develop computer and network software.',
    matchedTitle: 'Full Stack Software Engineer',
    similarityScore: 0.85,
  };

  const mockTechSkills = [
    {
      example: 'Docker',
      isHotTechnology: true,
      inDemand: true,
    },
    {
      example: 'Node.js',
      isHotTechnology: true,
      inDemand: false,
    },
    {
      example: 'C++',
      isHotTechnology: false,
      inDemand: false,
    },
  ];

  let mockOnetRepo: jest.Mocked<IOnetRepository>;

  beforeEach(async () => {
    mockOnetRepo = {
      findExactOccupationByTitle: jest.fn(),
      findFuzzyAlternateTitles: jest.fn(),
      findFuzzyOccupationData: jest.fn(),
      getOccupationBySocCode: jest.fn(),
      getToolsAndTechnology: jest.fn(),
      getDefaultOccupations: jest.fn(),
      searchOccupationsWithScores: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnetService,
        OnetFacade,
        {
          provide: ONET_FACADE_TOKEN,
          useExisting: OnetFacade,
        },
        {
          provide: ONET_REPOSITORY_TOKEN,
          useValue: mockOnetRepo,
        },
      ],
    }).compile();

    facade = module.get<IOnetFacade>(ONET_FACADE_TOKEN);
    service = module.get<OnetService>(OnetService);
  });

  it('should be defined', () => {
    expect(facade).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('findOccupationByTitle', () => {
    it('should return null if title is empty or whitespace', async () => {
      expect(await facade.findOccupationByTitle('')).toBeNull();
      expect(await facade.findOccupationByTitle('   ')).toBeNull();
      expect(mockOnetRepo.findExactOccupationByTitle).not.toHaveBeenCalled();
    });

    it('should return exact match when occupation title matches directly', async () => {
      mockOnetRepo.findExactOccupationByTitle.mockResolvedValueOnce(
        mockOccupation,
      );

      const result = await facade.findOccupationByTitle('Software Developers');
      expect(result).toEqual(mockOccupation);
      expect(mockOnetRepo.findExactOccupationByTitle).toHaveBeenCalledTimes(1);
    });

    it('should return fuzzy match from alternate job titles when exact match misses', async () => {
      mockOnetRepo.findExactOccupationByTitle.mockResolvedValueOnce(null);
      mockOnetRepo.findFuzzyAlternateTitles.mockResolvedValueOnce(
        mockFuzzyAlternateMatch,
      );

      const result = await facade.findOccupationByTitle(
        'Full Stack Software Engineer',
      );
      expect(result).toEqual(mockFuzzyAlternateMatch);
      expect(mockOnetRepo.findExactOccupationByTitle).toHaveBeenCalledTimes(1);
      expect(mockOnetRepo.findFuzzyAlternateTitles).toHaveBeenCalledTimes(1);
    });

    it('should fallback to fuzzy match on occupation_data when alternate titles miss', async () => {
      mockOnetRepo.findExactOccupationByTitle.mockResolvedValueOnce(null);
      mockOnetRepo.findFuzzyAlternateTitles.mockResolvedValueOnce(null);
      mockOnetRepo.findFuzzyOccupationData.mockResolvedValueOnce(
        mockOccupation,
      );

      const result = await facade.findOccupationByTitle('Software Dev');
      expect(result).toEqual(mockOccupation);
      expect(mockOnetRepo.findExactOccupationByTitle).toHaveBeenCalledTimes(1);
      expect(mockOnetRepo.findFuzzyAlternateTitles).toHaveBeenCalledTimes(1);
      expect(mockOnetRepo.findFuzzyOccupationData).toHaveBeenCalledTimes(1);
    });

    it('should return null when all searches find no matching occupation', async () => {
      mockOnetRepo.findExactOccupationByTitle.mockResolvedValueOnce(null);
      mockOnetRepo.findFuzzyAlternateTitles.mockResolvedValueOnce(null);
      mockOnetRepo.findFuzzyOccupationData.mockResolvedValueOnce(null);

      const result = await facade.findOccupationByTitle(
        'Random Nonexistent Job 12345',
      );
      expect(result).toBeNull();
    });

    it('should catch database errors and return null gracefully', async () => {
      mockOnetRepo.findExactOccupationByTitle.mockRejectedValueOnce(
        new Error('DB connection timeout'),
      );

      const result = await facade.findOccupationByTitle('Software Engineer');
      expect(result).toBeNull();
    });

    it('should translate Vietnamese title and find occupation successfully', async () => {
      const mockQaOccupation = {
        socCode: '15-1253.00',
        title: 'Software Quality Assurance Analysts and Testers',
        description: 'Test software for bugs.',
        matchedTitle: 'Software Quality Assurance Analysts and Testers',
        similarityScore: 1.0,
      };

      mockOnetRepo.findExactOccupationByTitle.mockResolvedValueOnce(
        mockQaOccupation,
      );

      const result = await facade.findOccupationByTitle(
        'Chuyên viên kiểm thử phần mềm',
      );
      expect(result).toEqual(mockQaOccupation);
      expect(result?.socCode).toBe('15-1253.00');
    });
  });

  describe('normalizeVietnameseJobTitle', () => {
    it('should normalize Vietnamese IT job titles to English equivalents', () => {
      expect(normalizeVietnameseJobTitle('Chuyên viên kiểm thử phần mềm')).toBe(
        'Software Quality Assurance Analysts and Testers',
      );
      expect(
        normalizeVietnameseJobTitle('Lập trình viên Backend Node.js'),
      ).toBe('Software Developers');
      expect(
        normalizeVietnameseJobTitle('Kỹ sư quản trị hệ thống DevOps'),
      ).toBe('Network and Computer Systems Administrators');
      expect(normalizeVietnameseJobTitle('Chuyên viên an toàn thông tin')).toBe(
        'Information Security Analysts',
      );
      expect(normalizeVietnameseJobTitle('Kỹ sư cơ sở dữ liệu')).toBe(
        'Database Architects',
      );
    });
  });

  describe('getOccupationBySocCode', () => {
    it('should return null for empty or whitespace socCode', async () => {
      expect(await facade.getOccupationBySocCode('')).toBeNull();
      expect(await facade.getOccupationBySocCode('   ')).toBeNull();
      expect(mockOnetRepo.getOccupationBySocCode).not.toHaveBeenCalled();
    });

    it('should return occupation for valid socCode', async () => {
      mockOnetRepo.getOccupationBySocCode.mockResolvedValueOnce(mockOccupation);

      const result = await facade.getOccupationBySocCode('15-1252.00');
      expect(result).toEqual(mockOccupation);
    });

    it('should return null when socCode is not found', async () => {
      mockOnetRepo.getOccupationBySocCode.mockResolvedValueOnce(null);

      const result = await facade.getOccupationBySocCode('99-9999.00');
      expect(result).toBeNull();
    });

    it('should catch error and return null', async () => {
      mockOnetRepo.getOccupationBySocCode.mockRejectedValueOnce(
        new Error('Query error'),
      );

      const result = await facade.getOccupationBySocCode('15-1252.00');
      expect(result).toBeNull();
    });
  });

  describe('getToolsAndTechnology', () => {
    it('should return empty array for empty or whitespace socCode', async () => {
      expect(await facade.getToolsAndTechnology('')).toEqual([]);
      expect(await facade.getToolsAndTechnology('   ')).toEqual([]);
      expect(mockOnetRepo.getToolsAndTechnology).not.toHaveBeenCalled();
    });

    it('should return mapped tools and technologies for socCode', async () => {
      mockOnetRepo.getToolsAndTechnology.mockResolvedValueOnce(mockTechSkills);

      const result = await facade.getToolsAndTechnology('15-1252.00');
      expect(result).toEqual(mockTechSkills);
    });

    it('should catch error and return empty array', async () => {
      mockOnetRepo.getToolsAndTechnology.mockRejectedValueOnce(
        new Error('Database error'),
      );

      const result = await facade.getToolsAndTechnology('15-1252.00');
      expect(result).toEqual([]);
    });
  });

  describe('searchOccupations', () => {
    it('returns default IT occupations when query is empty', async () => {
      mockOnetRepo.getDefaultOccupations.mockResolvedValueOnce([
        mockOccupation,
      ]);

      const result = await service.searchOccupations();
      expect(result).toEqual([mockOccupation]);
      expect(mockOnetRepo.getDefaultOccupations).toHaveBeenCalled();
    });

    it('returns searched occupations with similarity scores when query is provided', async () => {
      mockOnetRepo.searchOccupationsWithScores.mockResolvedValueOnce([
        mockFuzzyAlternateMatch,
      ]);

      const result = await service.searchOccupations('Software Engineer', 5);
      expect(result).toEqual([mockFuzzyAlternateMatch]);
      expect(mockOnetRepo.searchOccupationsWithScores).toHaveBeenCalled();
    });

    it('catches error and returns empty array on failure', async () => {
      mockOnetRepo.searchOccupationsWithScores.mockRejectedValueOnce(
        new Error('Database query failed'),
      );

      const result = await service.searchOccupations('crash');
      expect(result).toEqual([]);
    });
  });
});
