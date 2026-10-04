import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { SFIA_ADMIN_REPOSITORY_TOKEN } from './domain/sfia-admin-repository.interface';
import type { ISfiaAdminRepository } from './domain/sfia-admin-repository.interface';
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
  SfiaMatrixCellDataDto,
  SfiaCoverageStatsDto,
  CreateSfiaQuestionDto,
  SfiaQuestionBankItemDto,
} from './dto/sfia-admin.dto';

// ============================================================================
// VIETNAMESE LOCALIZATION LOOKUP TABLE
// ============================================================================
export const SFIA_VI_TRANSLATIONS: {
  categories: Record<string, string>;
  subcategories: Record<string, string>;
  levels: Record<number, string>;
  genericAttributes: Record<string, string>;
} = {
  categories: {
    STRAT_ARCH: 'Chiến lược & Kiến trúc',
    CHG_TRANS: 'Thay đổi & Chuyển đổi',
    DEV_IMPL: 'Phát triển & Triển khai',
    DELIV_OP: 'Vận hành & Cung cấp dịch vụ',
    PPL_SKILL: 'Con người & Kỹ năng',
    REL_ENG: 'Quan hệ & Tương tác',
  },
  subcategories: {
    STRAT: 'Chiến lược & Hoạch định',
    FINVAL: 'Tài chính & Quản lý giá trị',
    SECPRIV: 'An toàn thông tin & Quyền riêng tư',
    GOVRISK: 'Quản trị, Rủi ro & Tuân thủ',
    ADVGUID: 'Tư vấn & Hướng dẫn chuyên môn',
    CHGIMP: 'Triển khai thay đổi',
    CHGANA: 'Phân tích thay đổi',
    CHGPLAN: 'Kế hoạch chuyển đổi',
    SYSDEV: 'Phát triển hệ thống',
    DATAN: 'Dữ liệu & Phân tích',
    UCD: 'Thiết kế lấy người dùng làm trung tâm',
    CONTMGT: 'Quản lý nội dung số',
    COMPSCI: 'Khoa học tính toán',
    TECHMGT: 'Quản lý công nghệ',
    SERVMGT: 'Quản lý dịch vụ',
    SECSERV: 'Dịch vụ an ninh mạng',
    DATAOPS: 'Vận hành dữ liệu & Hồ sơ',
    PPLMGT: 'Quản lý nhân sự',
    SKLMGT: 'Quản lý năng lực kỹ năng',
    STAKEMGT: 'Quản lý các bên liên quan',
    SALESBID: 'Bán hàng & Đấu thầu',
    MKTG: 'Tiếp thị số',
  },
  levels: {
    1: 'Theo dõi & Học việc',
    2: 'Hỗ trợ',
    3: 'Áp dụng độc lập',
    4: 'Chủ động & Tạo điều kiện',
    5: 'Định hướng & Cố vấn',
    6: 'Khởi xướng & Tác động',
    7: 'Chiến lược & Truyền cảm hứng',
  },
  genericAttributes: {
    AUTONOMY: 'Mức độ tự chủ',
    INFLUENCE: 'Mức độ ảnh hưởng',
    COMPLEXITY: 'Độ phức tạp',
    BUSINESS_SKILLS: 'Kỹ năng kinh doanh & Đạo đức số',
    KNOWLEDGE: 'Kiến thức chuyên môn',
  },
};

@Injectable()
export class SfiaAdminService implements OnModuleInit {
  private readonly logger = new Logger(SfiaAdminService.name);

  // In-Memory Hybrid Cache for Static SFIA 9 Metadata
  private cachedCategories: SfiaCategoryDto[] = [];
  private cachedSubcategories: SfiaSubcategoryDto[] = [];
  private cachedLevels: SfiaLevelResponsibilityDto[] = [];
  private cachedGenericAttributes: SfiaGenericAttributeDto[] = [];
  private initialized = false;

  constructor(
    @Inject(SFIA_ADMIN_REPOSITORY_TOKEN)
    private readonly sfiaAdminRepo: ISfiaAdminRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadStaticCache();
  }

  /**
   * Nạp sẵn dữ liệu cấu trúc tĩnh SFIA 9 vào bộ nhớ đệm
   */
  async loadStaticCache(): Promise<void> {
    try {
      const [
        rawCategories,
        rawSubcategories,
        rawLevels,
        rawAttributes,
        rawAttributeLevels,
      ] = await Promise.all([
        this.sfiaAdminRepo.loadCategories(),
        this.sfiaAdminRepo.loadSubcategories(),
        this.sfiaAdminRepo.loadLevels(),
        this.sfiaAdminRepo.loadGenericAttributes(),
        this.sfiaAdminRepo.loadGenericAttributeLevels(),
      ]);

      // 1. Categories
      this.cachedCategories = rawCategories.map((c) => ({
        code: c.code,
        name: c.name,
        nameVi: SFIA_VI_TRANSLATIONS.categories[c.code] || c.name,
        description: c.description,
        displayOrder: c.displayOrder,
        skillCount: c.skillCount,
      }));

      // 2. Subcategories
      this.cachedSubcategories = rawSubcategories.map((sc) => ({
        code: sc.code,
        categoryCode: sc.categoryCode,
        name: sc.name,
        nameVi: SFIA_VI_TRANSLATIONS.subcategories[sc.code] || sc.name,
        description: sc.description,
        displayOrder: sc.displayOrder,
        skillCount: sc.skillCount,
      }));

      // 3. Levels
      this.cachedLevels = rawLevels.map((l) => ({
        levelId: l.levelId,
        name: l.name,
        nameVi: SFIA_VI_TRANSLATIONS.levels[l.levelId] || l.name,
        essence: l.essence,
        description: l.description,
      }));

      // 4. Generic Attributes with level mappings
      const levelMapByAttr: Record<string, Record<number, string>> = {};
      for (const gal of rawAttributeLevels) {
        if (!levelMapByAttr[gal.attributeCode]) {
          levelMapByAttr[gal.attributeCode] = {};
        }
        levelMapByAttr[gal.attributeCode][gal.levelId] = gal.description;
      }

      this.cachedGenericAttributes = rawAttributes.map((ga) => ({
        code: ga.code,
        name: ga.name,
        nameVi: SFIA_VI_TRANSLATIONS.genericAttributes[ga.code] || ga.name,
        description: ga.description,
        levels: levelMapByAttr[ga.code] || {},
      }));

      this.initialized = true;
      this.logger.log(
        `SFIA Admin In-Memory Cache loaded: ${this.cachedCategories.length} categories, ${this.cachedSubcategories.length} subcategories, ${this.cachedLevels.length} levels, ${this.cachedGenericAttributes.length} attributes.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to load SFIA Admin static cache: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 1. Lấy danh sách 6 danh mục lớn SFIA 9
   */
  async getCategories(): Promise<SfiaCategoryDto[]> {
    try {
      const rawCategories = await this.sfiaAdminRepo.loadCategories();
      return rawCategories.map((c) => ({
        code: c.code,
        name: c.name,
        nameVi: SFIA_VI_TRANSLATIONS.categories[c.code] || c.name,
        description: c.description,
        displayOrder: c.displayOrder,
        skillCount: c.skillCount,
      }));
    } catch (error) {
      this.logger.error(
        `Error in getCategories: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Fallback to in-memory cached categories if DB query throws
      if (this.cachedCategories.length > 0) return [...this.cachedCategories];
      throw error;
    }
  }

  /**
   * 2. Lấy danh sách 22 phân nhóm chuyên môn
   */
  async getSubcategories(categoryCode?: string): Promise<SfiaSubcategoryDto[]> {
    try {
      const rawSubcategories =
        await this.sfiaAdminRepo.loadSubcategories(categoryCode);
      return rawSubcategories.map((sc) => ({
        code: sc.code,
        categoryCode: sc.categoryCode,
        name: sc.name,
        nameVi: SFIA_VI_TRANSLATIONS.subcategories[sc.code] || sc.name,
        description: sc.description,
        displayOrder: sc.displayOrder,
        skillCount: sc.skillCount,
      }));
    } catch (error) {
      this.logger.error(
        `Error in getSubcategories: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (this.cachedSubcategories.length > 0) {
        return categoryCode
          ? this.cachedSubcategories.filter(
              (sc) => sc.categoryCode === categoryCode,
            )
          : [...this.cachedSubcategories];
      }
      throw error;
    }
  }

  /**
   * 3. Lấy danh sách kỹ năng SFIA có hỗ trợ bộ lọc và đếm số câu hỏi + O*NET
   */
  async getSkills(
    filters?: SfiaSkillFiltersQueryDto,
  ): Promise<SfiaSkillSummaryDto[]> {
    try {
      const rawSkills = await this.sfiaAdminRepo.loadSkillsWithCounts({
        categoryCode: filters?.categoryCode,
        subcategoryCode: filters?.subcategoryCode,
        level: filters?.level,
        query: filters?.query,
      });

      return rawSkills.map((s) => ({
        code: s.code,
        name: s.name,
        categoryCode: s.categoryCode,
        subcategoryCode: s.subcategoryCode,
        minLevel: s.minLevel,
        maxLevel: s.maxLevel,
        questionCount: s.questionCount,
        onetCount: s.onetCount,
      }));
    } catch (error) {
      this.logger.error(
        `Error in getSkills: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 4. Lấy chi tiết toàn diện một kỹ năng theo mã code 4 chữ cái (PROG, SWDN,...)
   */
  async getSkillDetail(skillCode: string): Promise<SfiaSkillDetailDto> {
    const cleanCode = skillCode?.trim().toUpperCase();
    if (!cleanCode) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Mã kỹ năng SFIA không được để trống.',
      );
    }

    try {
      const base = await this.sfiaAdminRepo.loadSkillDetailBase(cleanCode);
      if (!base) {
        throw new InterviewAIException(
          ErrorCode.SFIA_SKILL_NOT_FOUND,
          HttpStatus.NOT_FOUND,
          `Không tìm thấy kỹ năng SFIA với mã code "${cleanCode}".`,
        );
      }

      const [levels, onetMappings, questions] = await Promise.all([
        this.sfiaAdminRepo.loadSkillLevels(cleanCode),
        this.sfiaAdminRepo.loadSkillOnetMappings(cleanCode),
        this.sfiaAdminRepo.loadSkillQuestions(cleanCode),
      ]);

      return {
        code: base.code,
        name: base.name,
        categoryCode: base.categoryCode,
        subcategoryCode: base.subcategoryCode,
        minLevel: base.minLevel,
        maxLevel: base.maxLevel,
        questionCount: base.questionCount,
        onetCount: base.onetCount,
        overallDescription: base.overallDescription,
        guidanceNotes: base.guidanceNotes ?? undefined,
        skillLevels: levels.map((l) => ({
          skillCode: l.skillCode,
          levelId: l.levelId,
          description: l.description,
          essence: l.essence ?? undefined,
        })),
        onetMappings: onetMappings.map((m) => ({
          socCode: m.socCode,
          occupationTitle: m.occupationTitle,
          targetLevel: m.targetLevel,
          weight: m.weight,
          isCore: m.isCore,
        })),
        questionBankItems: questions.map((q) => ({
          id: q.id,
          questionText: q.questionText,
          type: q.type as 'TECHNICAL' | 'BEHAVIORAL' | 'SITUATIONAL' | 'HR',
          difficulty: q.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
          targetSfiaLevel: q.targetSfiaLevel,
        })),
      };
    } catch (error) {
      if (error instanceof InterviewAIException) throw error;
      this.logger.error(
        `Error in getSkillDetail for ${cleanCode}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 5. Endpoint tổng hợp toàn bộ Cây danh mục (Categories + Subcategories + Skills)
   */
  async getTaxonomy(): Promise<SfiaTaxonomyResponseDto> {
    try {
      const [categories, subcategories, skills] = await Promise.all([
        this.getCategories(),
        this.getSubcategories(),
        this.getSkills(),
      ]);

      return {
        categories,
        subcategories,
        skills,
      };
    } catch (error) {
      this.logger.error(
        `Error in getTaxonomy: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 6. Lấy danh sách 7 cấp độ trách nhiệm
   */
  async getResponsibilityLevels(): Promise<SfiaLevelResponsibilityDto[]> {
    try {
      const rawLevels = await this.sfiaAdminRepo.loadLevels();
      return rawLevels.map((l) => ({
        levelId: l.levelId,
        name: l.name,
        nameVi: SFIA_VI_TRANSLATIONS.levels[l.levelId] || l.name,
        essence: l.essence,
        description: l.description,
      }));
    } catch (error) {
      this.logger.error(
        `Error in getResponsibilityLevels: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (this.cachedLevels.length > 0) return [...this.cachedLevels];
      throw error;
    }
  }

  /**
   * 7. Lấy danh sách 16 thuộc tính chung và tiêu chuẩn qua 7 levels
   */
  async getGenericAttributes(): Promise<SfiaGenericAttributeDto[]> {
    try {
      const [rawAttributes, rawAttributeLevels] = await Promise.all([
        this.sfiaAdminRepo.loadGenericAttributes(),
        this.sfiaAdminRepo.loadGenericAttributeLevels(),
      ]);

      const levelMapByAttr: Record<string, Record<number, string>> = {};
      for (const gal of rawAttributeLevels) {
        if (!levelMapByAttr[gal.attributeCode]) {
          levelMapByAttr[gal.attributeCode] = {};
        }
        levelMapByAttr[gal.attributeCode][gal.levelId] = gal.description;
      }

      return rawAttributes.map((ga) => ({
        code: ga.code,
        name: ga.name,
        nameVi: SFIA_VI_TRANSLATIONS.genericAttributes[ga.code] || ga.name,
        description: ga.description,
        levels: levelMapByAttr[ga.code] || {},
      }));
    } catch (error) {
      this.logger.error(
        `Error in getGenericAttributes: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (this.cachedGenericAttributes.length > 0)
        return [...this.cachedGenericAttributes];
      throw error;
    }
  }

  /**
   * 8. Lấy toàn bộ dữ liệu ma trận 2D SFIA 147 kỹ năng x 7 level
   */
  async getMatrixData(categoryCode?: string): Promise<SfiaMatrixResponseDto> {
    try {
      const [skills, categories, rawCells] = await Promise.all([
        this.getSkills(categoryCode ? { categoryCode } : undefined),
        this.getCategories(),
        this.sfiaAdminRepo.loadMatrixCells(categoryCode),
      ]);

      // Dựng map ô ma trận dựa trên kết quả SQL
      const rawCellMap = new Map<
        string,
        {
          questionCount: number;
          onetCount: number;
          statementSnippet: string | null;
        }
      >();
      for (const cell of rawCells) {
        rawCellMap.set(`${cell.skillCode}_L${cell.levelId}`, {
          questionCount: cell.questionCount,
          onetCount: cell.onetCount,
          statementSnippet: cell.statementSnippet,
        });
      }

      // Khởi tạo đầy đủ 147 kỹ năng x 7 levels
      const cells: Record<string, SfiaMatrixCellDataDto> = {};

      for (const skill of skills) {
        for (let lvl = 1; lvl <= 7; lvl++) {
          const key = `${skill.code}_L${lvl}`;
          const isAvailable = lvl >= skill.minLevel && lvl <= skill.maxLevel;
          const found = rawCellMap.get(key);

          cells[key] = {
            skillCode: skill.code,
            levelId: lvl,
            isAvailable,
            questionCount: isAvailable ? found?.questionCount || 0 : 0,
            onetCount: isAvailable ? found?.onetCount || 0 : 0,
            statementSnippet: isAvailable
              ? (found?.statementSnippet ?? undefined)
              : undefined,
          };
        }
      }

      return {
        skills,
        categories,
        cells,
      };
    } catch (error) {
      this.logger.error(
        `Error in getMatrixData: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 9. Lấy số liệu thống kê độ phủ và danh sách cảnh báo điểm mù
   */
  async getCoverageStats(): Promise<SfiaCoverageStatsDto> {
    try {
      const [metrics, categoryDist, levelDist, topOnet] = await Promise.all([
        this.sfiaAdminRepo.loadCoverageMetrics(),
        this.sfiaAdminRepo.loadCategoryDistribution(),
        this.sfiaAdminRepo.loadLevelDistribution(),
        this.sfiaAdminRepo.loadTopOnetMappedSkills(10),
      ]);

      return {
        totalSkills: metrics.totalSkills,
        totalCategories: metrics.totalCategories,
        totalSubcategories: metrics.totalSubcategories,
        totalLevels: metrics.totalLevels,
        skillsWithQuestions: metrics.skillsWithQuestions,
        skillsWithOnet: metrics.skillsWithOnet,
        blindSpotsCount: metrics.blindSpotsCount,
        totalQuestions: metrics.totalQuestions,
        totalActiveMatrixCells: metrics.totalActiveMatrixCells,
        categoryDistribution: categoryDist.map((cd) => ({
          code: cd.code,
          name: cd.name,
          nameVi: SFIA_VI_TRANSLATIONS.categories[cd.code] || cd.name,
          skillCount: cd.skillCount,
          questionCount: cd.questionCount,
          mappedOnetCount: cd.mappedOnetCount,
        })),
        levelDistribution: levelDist.map((ld) => ({
          level: ld.level,
          name: `Level ${ld.level} — ${ld.name}`,
          shortName: `L${ld.level} ${ld.name}`,
          activeCellCount: ld.activeCellCount,
          questionCount: ld.questionCount,
        })),
        topOnetMappedSkills: topOnet.map((to) => ({
          skillCode: to.skillCode,
          skillName: to.skillName,
          categoryCode: to.categoryCode,
          onetCount: to.onetCount,
          coreCount: to.coreCount,
          questionCount: to.questionCount,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Error in getCoverageStats: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 10. Tạo câu hỏi phỏng vấn mới gắn nhãn kỹ năng và level SFIA
   */
  async createQuestion(
    skillCode: string,
    dto: CreateSfiaQuestionDto,
  ): Promise<SfiaQuestionBankItemDto> {
    const cleanCode = skillCode?.trim().toUpperCase();
    if (!cleanCode) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Mã kỹ năng SFIA không được để trống.',
      );
    }

    // 1. Kiểm tra kỹ năng tồn tại
    const skill = await this.sfiaAdminRepo.loadSkillDetailBase(cleanCode);
    if (!skill) {
      throw new InterviewAIException(
        ErrorCode.SFIA_SKILL_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        `Không tìm thấy kỹ năng SFIA với mã code "${cleanCode}".`,
      );
    }

    // 2. Kiểm tra ràng buộc dải level hợp lệ
    if (
      dto.targetSfiaLevel < skill.minLevel ||
      dto.targetSfiaLevel > skill.maxLevel
    ) {
      throw new InterviewAIException(
        ErrorCode.SFIA_SKILL_INVALID_LEVEL,
        HttpStatus.BAD_REQUEST,
        `Kỹ năng ${skill.name} (${skill.code}) chỉ khả dụng trong dải Level ${skill.minLevel} đến ${skill.maxLevel}. Cấp độ ${dto.targetSfiaLevel} không hợp lệ.`,
      );
    }

    // 3. Map difficulty và sessionType
    const difficultyMap: Record<string, number> = {
      EASY: 1,
      MEDIUM: 2,
      HARD: 3,
    };
    const difficulty = difficultyMap[dto.difficulty] || 2;
    const sessionType = dto.type === 'HR' ? 'hr' : 'technical';

    // 4. Gọi Repository để chèn vào question_bank
    try {
      const created = await this.sfiaAdminRepo.createQuestion({
        content: dto.questionText,
        sessionType,
        difficulty,
        sfiaSkillCode: cleanCode,
        targetSfiaLevel: dto.targetSfiaLevel,
      });

      return {
        id: created.id,
        questionText: created.questionText,
        type: created.type as 'TECHNICAL' | 'BEHAVIORAL' | 'SITUATIONAL' | 'HR',
        difficulty: created.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
        targetSfiaLevel: created.targetSfiaLevel,
      };
    } catch (error) {
      this.logger.error(
        `Error in createQuestion for ${cleanCode}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
