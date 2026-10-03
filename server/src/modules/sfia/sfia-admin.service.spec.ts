import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { SfiaAdminService } from './sfia-admin.service';
import {
  ISfiaAdminRepository,
  SFIA_ADMIN_REPOSITORY_TOKEN,
} from './domain/sfia-admin-repository.interface';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';

describe('SfiaAdminService', () => {
  let service: SfiaAdminService;
  let repoMock: jest.Mocked<ISfiaAdminRepository>;

  const mockCategories = [
    {
      code: 'DEV_IMPL',
      name: 'Development and implementation',
      description: 'Developing and implementing solutions',
      displayOrder: 3,
      skillCount: 42,
    },
  ];

  const mockSubcategories = [
    {
      code: 'SYSDEV',
      categoryCode: 'DEV_IMPL',
      name: 'Systems development',
      description: 'Systems development subcategory',
      displayOrder: 1,
      skillCount: 12,
    },
  ];

  const mockLevels = [
    {
      levelId: 3,
      name: 'Apply',
      essence: 'Applies knowledge and skills to perform tasks.',
      description: 'Works under general direction.',
    },
  ];

  const mockAttributes = [
    {
      code: 'AUTONOMY',
      name: 'Autonomy',
      description: 'Mức độ tự chủ',
      displayOrder: 1,
    },
  ];

  const mockAttributeLevels = [
    {
      attributeCode: 'AUTONOMY',
      levelId: 1,
      description: 'Works under close direction.',
    },
    {
      attributeCode: 'AUTONOMY',
      levelId: 3,
      description: 'Works under general direction.',
    },
  ];

  const mockSkillsWithCounts = [
    {
      code: 'PROG',
      name: 'Programming/software development',
      categoryCode: 'DEV_IMPL',
      subcategoryCode: 'SYSDEV',
      minLevel: 2,
      maxLevel: 6,
      questionCount: 15,
      onetCount: 8,
    },
  ];

  const mockSkillDetailBase = {
    code: 'PROG',
    name: 'Programming/software development',
    categoryCode: 'DEV_IMPL',
    subcategoryCode: 'SYSDEV',
    overallDescription: 'Designing, building, verifying software.',
    guidanceNotes: 'Guidance notes for PROG.',
    minLevel: 2,
    maxLevel: 6,
    questionCount: 15,
    onetCount: 8,
  };

  const mockSkillLevels = [
    {
      skillCode: 'PROG',
      levelId: 3,
      description: 'Applies software engineering principles.',
      essence: 'Applies knowledge and skills to perform tasks.',
    },
  ];

  const mockOnetMappings = [
    {
      socCode: '15-1252.00',
      occupationTitle: 'Software Developers',
      targetLevel: 3,
      weight: 1.0,
      isCore: true,
    },
  ];

  const mockQuestions = [
    {
      id: 'q-uuid-1',
      questionText: 'What is event loop in Node.js?',
      type: 'TECHNICAL',
      difficulty: 'MEDIUM',
      targetSfiaLevel: 3,
    },
  ];

  const mockMatrixCells = [
    {
      skillCode: 'PROG',
      levelId: 3,
      statementSnippet: 'Applies software engineering principles.',
      questionCount: 5,
      onetCount: 3,
    },
  ];

  const mockCoverageMetrics = {
    totalSkills: 147,
    totalCategories: 6,
    totalSubcategories: 22,
    totalLevels: 7,
    skillsWithQuestions: 98,
    skillsWithOnet: 75,
    blindSpotsCount: 49,
    totalQuestions: 340,
    totalActiveMatrixCells: 672,
  };

  const mockCategoryDistribution = [
    {
      code: 'DEV_IMPL',
      name: 'Development and implementation',
      skillCount: 42,
      questionCount: 120,
      mappedOnetCount: 35,
    },
  ];

  const mockLevelDistribution = [
    {
      level: 3,
      name: 'Apply',
      activeCellCount: 85,
      questionCount: 140,
    },
  ];

  const mockTopOnetMappedSkills = [
    {
      skillCode: 'PROG',
      skillName: 'Programming/software development',
      categoryCode: 'DEV_IMPL',
      onetCount: 12,
      coreCount: 8,
      questionCount: 25,
    },
  ];

  beforeEach(async () => {
    repoMock = {
      loadCategories: jest.fn().mockResolvedValue(mockCategories),
      loadSubcategories: jest.fn().mockResolvedValue(mockSubcategories),
      loadLevels: jest.fn().mockResolvedValue(mockLevels),
      loadGenericAttributes: jest.fn().mockResolvedValue(mockAttributes),
      loadGenericAttributeLevels: jest
        .fn()
        .mockResolvedValue(mockAttributeLevels),
      loadSkillsWithCounts: jest.fn().mockResolvedValue(mockSkillsWithCounts),
      loadSkillDetailBase: jest.fn().mockResolvedValue(mockSkillDetailBase),
      loadSkillLevels: jest.fn().mockResolvedValue(mockSkillLevels),
      loadSkillOnetMappings: jest.fn().mockResolvedValue(mockOnetMappings),
      loadSkillQuestions: jest.fn().mockResolvedValue(mockQuestions),
      loadMatrixCells: jest.fn().mockResolvedValue(mockMatrixCells),
      loadCoverageMetrics: jest.fn().mockResolvedValue(mockCoverageMetrics),
      loadCategoryDistribution: jest
        .fn()
        .mockResolvedValue(mockCategoryDistribution),
      loadLevelDistribution: jest.fn().mockResolvedValue(mockLevelDistribution),
      loadTopOnetMappedSkills: jest
        .fn()
        .mockResolvedValue(mockTopOnetMappedSkills),
      createQuestion: jest.fn().mockResolvedValue({
        id: 'new-q-uuid',
        questionText: 'Test question',
        type: 'TECHNICAL',
        difficulty: 'MEDIUM',
        targetSfiaLevel: 3,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SfiaAdminService,
        {
          provide: SFIA_ADMIN_REPOSITORY_TOKEN,
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<SfiaAdminService>(SfiaAdminService);
    await service.onModuleInit();
  });

  it('should be defined and initialized', () => {
    expect(service).toBeDefined();
    expect(service.isInitialized()).toBe(true);
  });

  describe('getCategories', () => {
    it('returns categories with Vietnamese nameVi mapped', async () => {
      const res = await service.getCategories();
      expect(res).toHaveLength(1);
      expect(res[0].code).toBe('DEV_IMPL');
      expect(res[0].nameVi).toBe('Phát triển & Triển khai');
      expect(res[0].skillCount).toBe(42);
    });

    it('falls back to cache when DB throws error', async () => {
      repoMock.loadCategories.mockRejectedValueOnce(new Error('DB failure'));
      const res = await service.getCategories();
      expect(res).toHaveLength(1);
      expect(res[0].code).toBe('DEV_IMPL');
    });
  });

  describe('getSubcategories', () => {
    it('returns subcategories with nameVi mapped', async () => {
      const res = await service.getSubcategories('DEV_IMPL');
      expect(res).toHaveLength(1);
      expect(res[0].code).toBe('SYSDEV');
      expect(res[0].nameVi).toBe('Phát triển hệ thống');
    });

    it('supports omitting categoryCode', async () => {
      const res = await service.getSubcategories();
      expect(res).toHaveLength(1);
      expect(repoMock.loadSubcategories).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getSkills', () => {
    it('returns skills summaries with counts', async () => {
      const res = await service.getSkills({
        categoryCode: 'DEV_IMPL',
        level: 3,
      });
      expect(res).toHaveLength(1);
      expect(res[0].code).toBe('PROG');
      expect(res[0].questionCount).toBe(15);
      expect(res[0].onetCount).toBe(8);
      expect(repoMock.loadSkillsWithCounts).toHaveBeenCalledWith({
        categoryCode: 'DEV_IMPL',
        subcategoryCode: undefined,
        level: 3,
        query: undefined,
      });
    });
  });

  describe('getSkillDetail', () => {
    it('returns full skill detail with levels, onet, and questions', async () => {
      const res = await service.getSkillDetail('prog');
      expect(res.code).toBe('PROG');
      expect(res.overallDescription).toBe(
        'Designing, building, verifying software.',
      );
      expect(res.skillLevels).toHaveLength(1);
      expect(res.onetMappings).toHaveLength(1);
      expect(res.questionBankItems).toHaveLength(1);
    });

    it('throws VALIDATION_ERROR when code is empty', async () => {
      await expect(service.getSkillDetail('')).rejects.toThrow(
        InterviewAIException,
      );
      try {
        await service.getSkillDetail('');
      } catch (err: any) {
        expect(err.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
        expect(err.status).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('throws SFIA_SKILL_NOT_FOUND when skill does not exist', async () => {
      repoMock.loadSkillDetailBase.mockResolvedValueOnce(null);
      await expect(service.getSkillDetail('UNKNOWN')).rejects.toThrow(
        InterviewAIException,
      );
      try {
        await service.getSkillDetail('UNKNOWN');
      } catch (err: any) {
        expect(err.errorCode).toBe(ErrorCode.SFIA_SKILL_NOT_FOUND);
        expect(err.status).toBe(HttpStatus.NOT_FOUND);
      }
    });
  });

  describe('getTaxonomy', () => {
    it('returns composite taxonomy response', async () => {
      const res = await service.getTaxonomy();
      expect(res.categories).toHaveLength(1);
      expect(res.subcategories).toHaveLength(1);
      expect(res.skills).toHaveLength(1);
    });
  });

  describe('getResponsibilityLevels', () => {
    it('returns levels enriched with Vietnamese translation', async () => {
      const res = await service.getResponsibilityLevels();
      expect(res).toHaveLength(1);
      expect(res[0].levelId).toBe(3);
      expect(res[0].nameVi).toBe('Áp dụng độc lập');
    });
  });

  describe('getGenericAttributes', () => {
    it('returns generic attributes with grouped levels map', async () => {
      const res = await service.getGenericAttributes();
      expect(res).toHaveLength(1);
      expect(res[0].code).toBe('AUTONOMY');
      expect(res[0].nameVi).toBe('Mức độ tự chủ');
      expect(res[0].levels[1]).toBe('Works under close direction.');
      expect(res[0].levels[3]).toBe('Works under general direction.');
    });
  });

  describe('getMatrixData', () => {
    it('generates 2D matrix structure for 7 levels', async () => {
      const res = await service.getMatrixData();
      expect(res.skills).toHaveLength(1);
      expect(res.categories).toHaveLength(1);

      // PROG is minLevel=2, maxLevel=6
      // Level 1 should be unavailable
      expect(res.cells['PROG_L1']).toEqual({
        skillCode: 'PROG',
        levelId: 1,
        isAvailable: false,
        questionCount: 0,
        onetCount: 0,
        statementSnippet: undefined,
      });

      // Level 3 should be available and have counts from DB
      expect(res.cells['PROG_L3']).toEqual({
        skillCode: 'PROG',
        levelId: 3,
        isAvailable: true,
        questionCount: 5,
        onetCount: 3,
        statementSnippet: 'Applies software engineering principles.',
      });

      // Level 7 should be unavailable
      expect(res.cells['PROG_L7']).toEqual({
        skillCode: 'PROG',
        levelId: 7,
        isAvailable: false,
        questionCount: 0,
        onetCount: 0,
        statementSnippet: undefined,
      });
    });
  });

  describe('getCoverageStats', () => {
    it('returns complete coverage analytics', async () => {
      const res = await service.getCoverageStats();
      expect(res.totalSkills).toBe(147);
      expect(res.categoryDistribution[0].nameVi).toBe(
        'Phát triển & Triển khai',
      );
      expect(res.levelDistribution[0].shortName).toBe('L3 Apply');
      expect(res.topOnetMappedSkills[0].skillCode).toBe('PROG');
    });
  });

  describe('createQuestion', () => {
    it('creates a question successfully when skill and level are valid', async () => {
      const res = await service.createQuestion('prog', {
        questionText: 'Test event loop',
        type: 'TECHNICAL',
        difficulty: 'MEDIUM',
        targetSfiaLevel: 3,
      });

      expect(res).toEqual({
        id: 'new-q-uuid',
        questionText: 'Test question',
        type: 'TECHNICAL',
        difficulty: 'MEDIUM',
        targetSfiaLevel: 3,
      });

      expect(repoMock.createQuestion).toHaveBeenCalledWith({
        content: 'Test event loop',
        sessionType: 'technical',
        difficulty: 2,
        sfiaSkillCode: 'PROG',
        targetSfiaLevel: 3,
      });
    });

    it('throws SFIA_SKILL_NOT_FOUND when skill does not exist', async () => {
      repoMock.loadSkillDetailBase.mockResolvedValueOnce(null);

      await expect(
        service.createQuestion('UNKNOWN', {
          questionText: 'Test question',
          type: 'TECHNICAL',
          difficulty: 'MEDIUM',
          targetSfiaLevel: 3,
        }),
      ).rejects.toThrow(InterviewAIException);

      try {
        await service.createQuestion('UNKNOWN', {
          questionText: 'Test question',
          type: 'TECHNICAL',
          difficulty: 'MEDIUM',
          targetSfiaLevel: 3,
        });
      } catch (err: any) {
        expect(err.errorCode).toBe(ErrorCode.SFIA_SKILL_NOT_FOUND);
      }
    });

    it('throws SFIA_SKILL_INVALID_LEVEL when level is outside min_level..max_level', async () => {
      // PROG minLevel = 2, maxLevel = 6. Level 7 is outside!
      await expect(
        service.createQuestion('prog', {
          questionText: 'Test question',
          type: 'TECHNICAL',
          difficulty: 'MEDIUM',
          targetSfiaLevel: 7,
        }),
      ).rejects.toThrow(InterviewAIException);

      try {
        await service.createQuestion('prog', {
          questionText: 'Test question',
          type: 'TECHNICAL',
          difficulty: 'MEDIUM',
          targetSfiaLevel: 7,
        });
      } catch (err: any) {
        expect(err.errorCode).toBe(ErrorCode.SFIA_SKILL_INVALID_LEVEL);
        expect(err.status).toBe(HttpStatus.BAD_REQUEST);
      }
    });

    it('throws VALIDATION_ERROR when code is empty', async () => {
      await expect(
        service.createQuestion('', {
          questionText: 'Test question',
          type: 'TECHNICAL',
          difficulty: 'MEDIUM',
          targetSfiaLevel: 3,
        }),
      ).rejects.toThrow(InterviewAIException);
    });
  });
});
