import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { SfiaAdminController } from './sfia-admin.controller';
import { SfiaAdminService } from './sfia-admin.service';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import {
  SfiaCategoryDto,
  SfiaSubcategoryDto,
  SfiaSkillSummaryDto,
  SfiaSkillFiltersQueryDto,
  SfiaSkillDetailDto,
  SfiaTaxonomyResponseDto,
  SfiaLevelResponsibilityDto,
  SfiaGenericAttributeDto,
  SfiaMatrixResponseDto,
  SfiaCoverageStatsDto,
  CreateSfiaQuestionDto,
  SfiaQuestionBankItemDto,
} from './dto/sfia-admin.dto';

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

const mockCategory: SfiaCategoryDto = {
  code: 'DEV_IMPL',
  name: 'Development and implementation',
  nameVi: 'Phát triển & Triển khai',
  description: 'Developing and implementing digital solutions',
  displayOrder: 3,
  skillCount: 42,
};

const mockSubcategory: SfiaSubcategoryDto = {
  code: 'SYSDEV',
  categoryCode: 'DEV_IMPL',
  name: 'Systems development',
  nameVi: 'Phát triển hệ thống',
  description: 'Systems development subcategory',
  displayOrder: 1,
  skillCount: 12,
};

const mockSkillSummary: SfiaSkillSummaryDto = {
  code: 'PROG',
  name: 'Programming/software development',
  categoryCode: 'DEV_IMPL',
  subcategoryCode: 'SYSDEV',
  minLevel: 2,
  maxLevel: 6,
  questionCount: 15,
  onetCount: 8,
};

const mockTaxonomy: SfiaTaxonomyResponseDto = {
  categories: [mockCategory],
  subcategories: [mockSubcategory],
  skills: [mockSkillSummary],
};

const mockSkillDetail: SfiaSkillDetailDto = {
  ...mockSkillSummary,
  overallDescription: 'The planning, designing, creation...',
  guidanceNotes: 'Relevant to software engineering...',
  skillLevels: [
    {
      skillCode: 'PROG',
      levelId: 3,
      description: 'Applies software engineering principles...',
      essence: 'Applies knowledge and skills...',
    },
  ],
  onetMappings: [
    {
      socCode: '15-1252.00',
      occupationTitle: 'Software Developers',
      targetLevel: 3,
      weight: 1.0,
      isCore: true,
    },
  ],
  questionBankItems: [
    {
      id: 'q-uuid-001',
      questionText: 'Explain Event Loop in Node.js',
      type: 'TECHNICAL',
      difficulty: 'MEDIUM',
      targetSfiaLevel: 3,
    },
  ],
};

const mockLevel: SfiaLevelResponsibilityDto = {
  levelId: 3,
  name: 'Apply',
  nameVi: 'Áp dụng độc lập',
  essence: 'Applies knowledge and skills to perform tasks.',
  description: 'Works under general direction.',
};

const mockAttribute: SfiaGenericAttributeDto = {
  code: 'AUTONOMY',
  name: 'Autonomy',
  nameVi: 'Mức độ tự chủ',
  description: 'Works under close supervision.',
  levels: { 1: 'Close supervision.', 2: 'Routine direction.' },
};

const mockMatrixResponse: SfiaMatrixResponseDto = {
  skills: [mockSkillSummary],
  categories: [mockCategory],
  cells: {
    PROG_L3: {
      skillCode: 'PROG',
      levelId: 3,
      isAvailable: true,
      questionCount: 4,
      onetCount: 2,
      statementSnippet: 'Applies engineering principles...',
    },
  },
};

const mockCoverageStats: SfiaCoverageStatsDto = {
  totalSkills: 147,
  totalCategories: 6,
  totalSubcategories: 22,
  totalLevels: 7,
  skillsWithQuestions: 98,
  skillsWithOnet: 75,
  blindSpotsCount: 49,
  totalQuestions: 340,
  totalActiveMatrixCells: 672,
  categoryDistribution: [],
  levelDistribution: [],
  topOnetMappedSkills: [],
};

const mockCreatedQuestion: SfiaQuestionBankItemDto = {
  id: 'q-uuid-new-001',
  questionText: 'Giải thích nguyên lý Event Loop trong Node.js.',
  type: 'TECHNICAL',
  difficulty: 'MEDIUM',
  targetSfiaLevel: 3,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SfiaAdminController', () => {
  let controller: SfiaAdminController;
  let serviceMock: jest.Mocked<SfiaAdminService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SfiaAdminController],
      providers: [
        {
          provide: SfiaAdminService,
          useValue: {
            getTaxonomy: jest.fn(),
            getCategories: jest.fn(),
            getSubcategories: jest.fn(),
            getSkills: jest.fn(),
            getSkillDetail: jest.fn(),
            getResponsibilityLevels: jest.fn(),
            getGenericAttributes: jest.fn(),
            getMatrixData: jest.fn(),
            getCoverageStats: jest.fn(),
            createQuestion: jest.fn(),
          } satisfies Partial<jest.Mocked<SfiaAdminService>>,
        },
      ],
    }).compile();

    controller = module.get<SfiaAdminController>(SfiaAdminController);
    serviceMock = module.get(SfiaAdminService);
  });

  // -------------------------------------------------------------------------
  // 1. GET /admin/sfia/taxonomy
  // -------------------------------------------------------------------------
  describe('getTaxonomy()', () => {
    it('should delegate to sfiaAdminService.getTaxonomy() and return the result', async () => {
      serviceMock.getTaxonomy.mockResolvedValue(mockTaxonomy);

      const result = await controller.getTaxonomy();

      expect(serviceMock.getTaxonomy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTaxonomy);
      expect(result.categories).toHaveLength(1);
      expect(result.subcategories).toHaveLength(1);
      expect(result.skills).toHaveLength(1);
    });

    it('should propagate errors from the service', async () => {
      serviceMock.getTaxonomy.mockRejectedValue(new Error('DB error'));

      await expect(controller.getTaxonomy()).rejects.toThrow('DB error');
    });
  });

  // -------------------------------------------------------------------------
  // 2. GET /admin/sfia/categories
  // -------------------------------------------------------------------------
  describe('getCategories()', () => {
    it('should return list of categories from the service', async () => {
      serviceMock.getCategories.mockResolvedValue([mockCategory]);

      const result = await controller.getCategories();

      expect(serviceMock.getCategories).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockCategory]);
    });

    it('should return empty array when no categories exist', async () => {
      serviceMock.getCategories.mockResolvedValue([]);

      const result = await controller.getCategories();
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // 3. GET /admin/sfia/subcategories
  // -------------------------------------------------------------------------
  describe('getSubcategories()', () => {
    it('should pass categoryCode filter to the service', async () => {
      serviceMock.getSubcategories.mockResolvedValue([mockSubcategory]);

      const result = await controller.getSubcategories('DEV_IMPL');

      expect(serviceMock.getSubcategories).toHaveBeenCalledWith('DEV_IMPL');
      expect(result).toEqual([mockSubcategory]);
    });

    it('should call getSubcategories with undefined when no filter provided', async () => {
      serviceMock.getSubcategories.mockResolvedValue([mockSubcategory]);

      await controller.getSubcategories();

      expect(serviceMock.getSubcategories).toHaveBeenCalledWith(undefined);
    });
  });

  // -------------------------------------------------------------------------
  // 4. GET /admin/sfia/skills
  // -------------------------------------------------------------------------
  describe('getSkills()', () => {
    it('should pass filters to the service and return skill summaries', async () => {
      serviceMock.getSkills.mockResolvedValue([mockSkillSummary]);
      const filters: SfiaSkillFiltersQueryDto = {
        categoryCode: 'DEV_IMPL',
        level: 3,
      };

      const result = await controller.getSkills(filters);

      expect(serviceMock.getSkills).toHaveBeenCalledWith(filters);
      expect(result).toEqual([mockSkillSummary]);
    });

    it('should pass empty filters when no query params', async () => {
      serviceMock.getSkills.mockResolvedValue([mockSkillSummary]);

      await controller.getSkills({});

      expect(serviceMock.getSkills).toHaveBeenCalledWith({});
    });
  });

  // -------------------------------------------------------------------------
  // 5. GET /admin/sfia/skills/:code
  // -------------------------------------------------------------------------
  describe('getSkillDetail()', () => {
    it('should return full skill detail for a valid code', async () => {
      serviceMock.getSkillDetail.mockResolvedValue(mockSkillDetail);

      const result = await controller.getSkillDetail('PROG');

      expect(serviceMock.getSkillDetail).toHaveBeenCalledWith('PROG');
      expect(result).toEqual(mockSkillDetail);
      expect(result.skillLevels).toHaveLength(1);
      expect(result.onetMappings).toHaveLength(1);
      expect(result.questionBankItems).toHaveLength(1);
    });

    it('should propagate SFIA_SKILL_NOT_FOUND when skill does not exist', async () => {
      serviceMock.getSkillDetail.mockRejectedValue(
        new InterviewAIException(
          ErrorCode.SFIA_SKILL_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'Không tìm thấy kỹ năng SFIA với mã code "XXXX".',
        ),
      );

      await expect(controller.getSkillDetail('XXXX')).rejects.toBeInstanceOf(
        InterviewAIException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // 6. GET /admin/sfia/levels
  // -------------------------------------------------------------------------
  describe('getResponsibilityLevels()', () => {
    it('should return the 7 responsibility levels from the service', async () => {
      serviceMock.getResponsibilityLevels.mockResolvedValue([mockLevel]);

      const result = await controller.getResponsibilityLevels();

      expect(serviceMock.getResponsibilityLevels).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockLevel]);
    });
  });

  // -------------------------------------------------------------------------
  // 7. GET /admin/sfia/generic-attributes
  // -------------------------------------------------------------------------
  describe('getGenericAttributes()', () => {
    it('should return generic attributes from the service', async () => {
      serviceMock.getGenericAttributes.mockResolvedValue([mockAttribute]);

      const result = await controller.getGenericAttributes();

      expect(serviceMock.getGenericAttributes).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockAttribute]);
    });
  });

  // -------------------------------------------------------------------------
  // 8. GET /admin/sfia/matrix
  // -------------------------------------------------------------------------
  describe('getMatrixData()', () => {
    it('should pass categoryCode filter and return matrix response', async () => {
      serviceMock.getMatrixData.mockResolvedValue(mockMatrixResponse);

      const result = await controller.getMatrixData('DEV_IMPL');

      expect(serviceMock.getMatrixData).toHaveBeenCalledWith('DEV_IMPL');
      expect(result).toEqual(mockMatrixResponse);
      expect(result.cells['PROG_L3']).toBeDefined();
    });

    it('should call getMatrixData with undefined when no filter', async () => {
      serviceMock.getMatrixData.mockResolvedValue(mockMatrixResponse);

      await controller.getMatrixData();

      expect(serviceMock.getMatrixData).toHaveBeenCalledWith(undefined);
    });
  });

  // -------------------------------------------------------------------------
  // 9. GET /admin/sfia/analytics/coverage
  // -------------------------------------------------------------------------
  describe('getCoverageStats()', () => {
    it('should return coverage statistics from the service', async () => {
      serviceMock.getCoverageStats.mockResolvedValue(mockCoverageStats);

      const result = await controller.getCoverageStats();

      expect(serviceMock.getCoverageStats).toHaveBeenCalledTimes(1);
      expect(result.totalSkills).toBe(147);
      expect(result.totalCategories).toBe(6);
      expect(result.totalLevels).toBe(7);
      expect(result.blindSpotsCount).toBe(49);
    });
  });

  // -------------------------------------------------------------------------
  // 10. POST /admin/sfia/skills/:code/questions
  // -------------------------------------------------------------------------
  describe('createQuestion()', () => {
    const validDto: CreateSfiaQuestionDto = {
      questionText: 'Giải thích nguyên lý Event Loop trong Node.js.',
      type: 'TECHNICAL',
      difficulty: 'MEDIUM',
      targetSfiaLevel: 3,
    };

    it('should delegate to sfiaAdminService.createQuestion() and return the created item', async () => {
      serviceMock.createQuestion.mockResolvedValue(mockCreatedQuestion);

      const result = await controller.createQuestion('PROG', validDto);

      expect(serviceMock.createQuestion).toHaveBeenCalledWith('PROG', validDto);
      expect(result).toEqual(mockCreatedQuestion);
      expect(result.type).toBe('TECHNICAL');
      expect(result.targetSfiaLevel).toBe(3);
    });

    it('should propagate VALIDATION_ERROR when skill code is empty', async () => {
      serviceMock.createQuestion.mockRejectedValue(
        new InterviewAIException(
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          'Mã kỹ năng SFIA không được để trống.',
        ),
      );

      await expect(
        controller.createQuestion('', validDto),
      ).rejects.toBeInstanceOf(InterviewAIException);
    });

    it('should propagate SFIA_SKILL_INVALID_LEVEL when target level is out of range', async () => {
      serviceMock.createQuestion.mockRejectedValue(
        new InterviewAIException(
          ErrorCode.SFIA_SKILL_INVALID_LEVEL,
          HttpStatus.BAD_REQUEST,
          'Kỹ năng PROG chỉ khả dụng trong dải Level 2 đến 6.',
        ),
      );

      const invalidDto: CreateSfiaQuestionDto = {
        ...validDto,
        targetSfiaLevel: 7,
      };

      await expect(
        controller.createQuestion('PROG', invalidDto),
      ).rejects.toBeInstanceOf(InterviewAIException);
    });

    it('should propagate SFIA_SKILL_NOT_FOUND when skill does not exist', async () => {
      serviceMock.createQuestion.mockRejectedValue(
        new InterviewAIException(
          ErrorCode.SFIA_SKILL_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'Không tìm thấy kỹ năng SFIA với mã code "UNKW".',
        ),
      );

      await expect(
        controller.createQuestion('UNKW', validDto),
      ).rejects.toBeInstanceOf(InterviewAIException);
    });
  });
});
