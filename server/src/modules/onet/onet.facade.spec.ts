import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ONET_FACADE_TOKEN, IOnetFacade } from './contracts/onet.facade.interface';
import { OnetService } from './onet.service';
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

  let queryRawMock: jest.Mock;

  beforeEach(async () => {
    queryRawMock = jest.fn();

    const mockPrismaService = {
      $queryRaw: queryRawMock,
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
          provide: PrismaService,
          useValue: mockPrismaService,
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
      expect(queryRawMock).not.toHaveBeenCalled();
    });

    it('should return exact match when occupation title matches directly', async () => {
      queryRawMock.mockResolvedValueOnce([mockOccupation]);

      const result = await facade.findOccupationByTitle('Software Developers');
      expect(result).toEqual(mockOccupation);
      expect(queryRawMock).toHaveBeenCalledTimes(1);
    });

    it('should return fuzzy match from alternate job titles when exact match misses', async () => {
      // 1st query: exact match on occupation_data -> empty
      queryRawMock.mockResolvedValueOnce([]);
      // 2nd query: fuzzy match on job_titles -> returns match
      queryRawMock.mockResolvedValueOnce([mockFuzzyAlternateMatch]);

      const result = await facade.findOccupationByTitle('Full Stack Software Engineer');
      expect(result).toEqual(mockFuzzyAlternateMatch);
      expect(queryRawMock).toHaveBeenCalledTimes(2);
    });

    it('should fallback to fuzzy match on occupation_data when alternate titles miss', async () => {
      // 1st query: exact -> empty
      queryRawMock.mockResolvedValueOnce([]);
      // 2nd query: alternate titles -> empty
      queryRawMock.mockResolvedValueOnce([]);
      // 3rd query: fallback on occupation_data -> returns match
      queryRawMock.mockResolvedValueOnce([mockOccupation]);

      const result = await facade.findOccupationByTitle('Software Dev');
      expect(result).toEqual(mockOccupation);
      expect(queryRawMock).toHaveBeenCalledTimes(3);
    });

    it('should return null when all searches find no matching occupation', async () => {
      queryRawMock.mockResolvedValueOnce([]);
      queryRawMock.mockResolvedValueOnce([]);
      queryRawMock.mockResolvedValueOnce([]);

      const result = await facade.findOccupationByTitle('Random Nonexistent Job 12345');
      expect(result).toBeNull();
    });

    it('should catch database errors and return null gracefully', async () => {
      queryRawMock.mockRejectedValueOnce(new Error('DB connection timeout'));

      const result = await facade.findOccupationByTitle('Software Engineer');
      expect(result).toBeNull();
    });

    it('should translate Vietnamese title and find occupation successfully', async () => {
      // Direct exact match on translated title 'Software Quality Assurance Analysts and Testers'
      const mockQaOccupation = {
        socCode: '15-1253.00',
        title: 'Software Quality Assurance Analysts and Testers',
        description: 'Test software for bugs.',
        matchedTitle: 'Software Quality Assurance Analysts and Testers',
        similarityScore: 1.0,
      };

      queryRawMock.mockResolvedValueOnce([mockQaOccupation]);

      const result = await facade.findOccupationByTitle(
        'Chuyên viên kiểm thử phần mềm',
      );
      expect(result).toEqual(mockQaOccupation);
      expect(result?.socCode).toBe('15-1253.00');
    });
  });

  describe('normalizeVietnameseJobTitle', () => {
    it('should normalize Vietnamese IT job titles to English equivalents', () => {
      const { normalizeVietnameseJobTitle } = require('./onet.service');
      expect(
        normalizeVietnameseJobTitle('Chuyên viên kiểm thử phần mềm'),
      ).toBe('Software Quality Assurance Analysts and Testers');
      expect(
        normalizeVietnameseJobTitle('Lập trình viên Backend Node.js'),
      ).toBe('Software Developers');
      expect(
        normalizeVietnameseJobTitle('Kỹ sư quản trị hệ thống DevOps'),
      ).toBe('Network and Computer Systems Administrators');
      expect(
        normalizeVietnameseJobTitle('Chuyên viên an toàn thông tin'),
      ).toBe('Information Security Analysts');
      expect(
        normalizeVietnameseJobTitle('Kỹ sư cơ sở dữ liệu'),
      ).toBe('Database Architects');
    });
  });

  describe('getOccupationBySocCode', () => {
    it('should return null for empty or whitespace socCode', async () => {
      expect(await facade.getOccupationBySocCode('')).toBeNull();
      expect(await facade.getOccupationBySocCode('   ')).toBeNull();
      expect(queryRawMock).not.toHaveBeenCalled();
    });

    it('should return occupation for valid socCode', async () => {
      queryRawMock.mockResolvedValueOnce([mockOccupation]);

      const result = await facade.getOccupationBySocCode('15-1252.00');
      expect(result).toEqual(mockOccupation);
    });

    it('should return null when socCode is not found', async () => {
      queryRawMock.mockResolvedValueOnce([]);

      const result = await facade.getOccupationBySocCode('99-9999.00');
      expect(result).toBeNull();
    });

    it('should catch error and return null', async () => {
      queryRawMock.mockRejectedValueOnce(new Error('Query error'));

      const result = await facade.getOccupationBySocCode('15-1252.00');
      expect(result).toBeNull();
    });
  });

  describe('getToolsAndTechnology', () => {
    it('should return empty array for empty or whitespace socCode', async () => {
      expect(await facade.getToolsAndTechnology('')).toEqual([]);
      expect(await facade.getToolsAndTechnology('   ')).toEqual([]);
      expect(queryRawMock).not.toHaveBeenCalled();
    });

    it('should return mapped tools and technologies for socCode', async () => {
      queryRawMock.mockResolvedValueOnce([
        { example: 'Docker', isHotTechnology: true, inDemand: true },
        { example: 'Node.js', isHotTechnology: true, inDemand: false },
        { example: 'C++', isHotTechnology: false, inDemand: false },
      ]);

      const result = await facade.getToolsAndTechnology('15-1252.00');
      expect(result).toEqual(mockTechSkills);
    });

    it('should catch error and return empty array', async () => {
      queryRawMock.mockRejectedValueOnce(new Error('Database error'));

      const result = await facade.getToolsAndTechnology('15-1252.00');
      expect(result).toEqual([]);
    });
  });
});
