import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { QuestionSessionType } from '@prisma/client';
import { SfiaAdminRepository } from './sfia-admin.repository';
import {
  ISfiaAdminRepository,
  SFIA_ADMIN_REPOSITORY_TOKEN,
} from '../domain/sfia-admin-repository.interface';

describe('SfiaAdminRepository', () => {
  let repository: ISfiaAdminRepository;
  let queryRawMock: jest.Mock;
  let questionBankCreateMock: jest.Mock;

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
    overallDescription: 'Designing, building, testing software.',
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

  const mockLevels = [
    {
      levelId: 3,
      name: 'Apply',
      essence: 'Applies knowledge and skills to perform tasks.',
      description: 'Works under general direction.',
    },
  ];

  const mockGenericAttributes = [
    {
      code: 'AUTONOMY',
      name: 'Autonomy',
      description: 'Mức độ tự chủ',
      displayOrder: 1,
    },
  ];

  const mockGenericAttributeLevels = [
    {
      attributeCode: 'AUTONOMY',
      levelId: 1,
      description: 'Works under close direction.',
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
    queryRawMock = jest.fn();
    questionBankCreateMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SfiaAdminRepository,
        {
          provide: SFIA_ADMIN_REPOSITORY_TOKEN,
          useExisting: SfiaAdminRepository,
        },
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: queryRawMock,
            questionBank: {
              create: questionBankCreateMock,
            },
          },
        },
      ],
    }).compile();

    repository = module.get<ISfiaAdminRepository>(SFIA_ADMIN_REPOSITORY_TOKEN);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('loadCategories', () => {
    it('returns categories with skillCount', async () => {
      queryRawMock.mockResolvedValueOnce(mockCategories);
      const res = await repository.loadCategories();
      expect(res).toEqual(mockCategories);
      expect(queryRawMock).toHaveBeenCalledTimes(1);
    });

    it('throws error when DB query fails', async () => {
      queryRawMock.mockRejectedValueOnce(new Error('DB Query Error'));
      await expect(repository.loadCategories()).rejects.toThrow('DB Query Error');
    });
  });

  describe('loadSubcategories', () => {
    it('returns subcategories with optional category filter', async () => {
      queryRawMock.mockResolvedValueOnce(mockSubcategories);
      const res = await repository.loadSubcategories('DEV_IMPL');
      expect(res).toEqual(mockSubcategories);
      expect(queryRawMock).toHaveBeenCalledTimes(1);
    });

    it('returns all subcategories when filter is omitted', async () => {
      queryRawMock.mockResolvedValueOnce(mockSubcategories);
      const res = await repository.loadSubcategories();
      expect(res).toEqual(mockSubcategories);
    });
  });

  describe('loadSkillsWithCounts', () => {
    it('returns skills with counts without filters', async () => {
      queryRawMock.mockResolvedValueOnce(mockSkillsWithCounts);
      const res = await repository.loadSkillsWithCounts();
      expect(res).toEqual(mockSkillsWithCounts);
    });

    it('applies query and category filters properly', async () => {
      queryRawMock.mockResolvedValueOnce(mockSkillsWithCounts);
      const res = await repository.loadSkillsWithCounts({
        categoryCode: 'DEV_IMPL',
        subcategoryCode: 'SYSDEV',
        level: 3,
        query: 'prog',
      });
      expect(res).toEqual(mockSkillsWithCounts);
      expect(queryRawMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadSkillDetailBase', () => {
    it('returns skill detail base when skill exists', async () => {
      queryRawMock.mockResolvedValueOnce([mockSkillDetailBase]);
      const res = await repository.loadSkillDetailBase('PROG');
      expect(res).toEqual(mockSkillDetailBase);
    });

    it('returns null when skill is not found', async () => {
      queryRawMock.mockResolvedValueOnce([]);
      const res = await repository.loadSkillDetailBase('UNKNOWN');
      expect(res).toBeNull();
    });
  });

  describe('loadSkillLevels', () => {
    it('returns level statements for a skill', async () => {
      queryRawMock.mockResolvedValueOnce(mockSkillLevels);
      const res = await repository.loadSkillLevels('PROG');
      expect(res).toEqual(mockSkillLevels);
    });
  });

  describe('loadSkillOnetMappings', () => {
    it('returns ONET occupation mappings for a skill', async () => {
      queryRawMock.mockResolvedValueOnce(mockOnetMappings);
      const res = await repository.loadSkillOnetMappings('PROG');
      expect(res).toEqual(mockOnetMappings);
    });
  });

  describe('loadSkillQuestions', () => {
    it('returns question bank items for a skill', async () => {
      queryRawMock.mockResolvedValueOnce(mockQuestions);
      const res = await repository.loadSkillQuestions('PROG');
      expect(res).toEqual(mockQuestions);
    });
  });

  describe('loadLevels', () => {
    it('returns 7 responsibility levels', async () => {
      queryRawMock.mockResolvedValueOnce(mockLevels);
      const res = await repository.loadLevels();
      expect(res).toEqual(mockLevels);
    });
  });

  describe('loadGenericAttributes & loadGenericAttributeLevels', () => {
    it('returns generic attributes', async () => {
      queryRawMock.mockResolvedValueOnce(mockGenericAttributes);
      const res = await repository.loadGenericAttributes();
      expect(res).toEqual(mockGenericAttributes);
    });

    it('returns generic attribute levels', async () => {
      queryRawMock.mockResolvedValueOnce(mockGenericAttributeLevels);
      const res = await repository.loadGenericAttributeLevels();
      expect(res).toEqual(mockGenericAttributeLevels);
    });
  });

  describe('loadMatrixCells', () => {
    it('returns 2D matrix cell records', async () => {
      queryRawMock.mockResolvedValueOnce(mockMatrixCells);
      const res = await repository.loadMatrixCells('DEV_IMPL');
      expect(res).toEqual(mockMatrixCells);
    });
  });

  describe('loadCoverageMetrics', () => {
    it('returns coverage summary KPIs', async () => {
      queryRawMock.mockResolvedValueOnce([mockCoverageMetrics]);
      const res = await repository.loadCoverageMetrics();
      expect(res).toEqual(mockCoverageMetrics);
    });

    it('falls back to default metrics when query result is empty', async () => {
      queryRawMock.mockResolvedValueOnce([]);
      const res = await repository.loadCoverageMetrics();
      expect(res.totalSkills).toBe(147);
      expect(res.totalCategories).toBe(6);
    });
  });

  describe('loadCategoryDistribution, loadLevelDistribution, loadTopOnetMappedSkills', () => {
    it('returns category distribution', async () => {
      queryRawMock.mockResolvedValueOnce(mockCategoryDistribution);
      const res = await repository.loadCategoryDistribution();
      expect(res).toEqual(mockCategoryDistribution);
    });

    it('returns level distribution', async () => {
      queryRawMock.mockResolvedValueOnce(mockLevelDistribution);
      const res = await repository.loadLevelDistribution();
      expect(res).toEqual(mockLevelDistribution);
    });

    it('returns top ONET mapped skills', async () => {
      queryRawMock.mockResolvedValueOnce(mockTopOnetMappedSkills);
      const res = await repository.loadTopOnetMappedSkills(5);
      expect(res).toEqual(mockTopOnetMappedSkills);
    });
  });

  describe('createQuestion', () => {
    it('creates a new question in question_bank and returns mapped item', async () => {
      questionBankCreateMock.mockResolvedValueOnce({
        id: 'new-q-uuid',
        content: 'Test question about caching',
        sessionType: QuestionSessionType.technical,
        difficulty: 2,
        targetSfiaLevel: 3,
      });

      const res = await repository.createQuestion({
        content: 'Test question about caching',
        sessionType: 'technical',
        difficulty: 2,
        sfiaSkillCode: 'PROG',
        targetSfiaLevel: 3,
      });

      expect(res).toEqual({
        id: 'new-q-uuid',
        questionText: 'Test question about caching',
        type: 'TECHNICAL',
        difficulty: 'MEDIUM',
        targetSfiaLevel: 3,
      });

      expect(questionBankCreateMock).toHaveBeenCalledWith({
        data: {
          content: 'Test question about caching',
          sessionType: QuestionSessionType.technical,
          difficulty: 2,
          contextPackId: 'VN', // 'VN' hợp lệ theo chk_question_bank_context_pack constraint
          sfiaSkillCode: 'PROG',
          targetSfiaLevel: 3,
        },
      });
    });

    it('handles hr sessionType and easy difficulty correctly', async () => {
      questionBankCreateMock.mockResolvedValueOnce({
        id: 'new-hr-uuid',
        content: 'Tell me about yourself',
        sessionType: QuestionSessionType.hr,
        difficulty: 1,
        targetSfiaLevel: 2,
      });

      const res = await repository.createQuestion({
        content: 'Tell me about yourself',
        sessionType: 'hr',
        difficulty: 1,
        sfiaSkillCode: 'PROG',
        targetSfiaLevel: 2,
      });

      expect(res.difficulty).toBe('EASY');
      expect(res.type).toBe('HR');
    });

    it('throws error when prisma create fails', async () => {
      questionBankCreateMock.mockRejectedValueOnce(new Error('Insert error'));
      await expect(
        repository.createQuestion({
          content: 'Error question',
          sessionType: 'technical',
          difficulty: 3,
          sfiaSkillCode: 'PROG',
          targetSfiaLevel: 4,
        }),
      ).rejects.toThrow('Insert error');
    });
  });
});
