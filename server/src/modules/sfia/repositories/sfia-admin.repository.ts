import { Injectable, Logger } from '@nestjs/common';
import { Prisma, QuestionSessionType } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ISfiaAdminRepository } from '../domain/sfia-admin-repository.interface';
import {
  SfiaCategoryRawRow,
  SfiaSubcategoryRawRow,
  SfiaSkillSummaryRawRow,
  SfiaSkillDetailBaseRawRow,
  SfiaSkillLevelStatementRawRow,
  SfiaOnetMappingRawRow,
  SfiaQuestionBankRawRow,
  SfiaLevelRawRow,
  SfiaGenericAttributeRawRow,
  SfiaGenericAttributeLevelRawRow,
  SfiaMatrixCellRawRow,
  SfiaCoverageMetricsRawRow,
  SfiaCategoryMetricRawRow,
  SfiaLevelMetricRawRow,
  SfiaTopOnetMappedSkillRawRow,
} from './types/sfia-admin-raw-row.types';

@Injectable()
export class SfiaAdminRepository implements ISfiaAdminRepository {
  private readonly logger = new Logger(SfiaAdminRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private getClient(tx?: Prisma.TransactionClient) {
    return tx || this.prisma;
  }

  /**
   * 1. Lấy danh sách 6 danh mục lớn kèm tổng số kỹ năng
   */
  async loadCategories(
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaCategoryRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<SfiaCategoryRawRow[]>`
        SELECT 
          c.code,
          c.name,
          COALESCE(c.description, '') AS description,
          c.display_order AS "displayOrder",
          COUNT(s.code)::int AS "skillCount"
        FROM sfia.categories c
        LEFT JOIN sfia.subcategories sc ON sc.category_code = c.code
        LEFT JOIN sfia.skills s ON s.subcategory_code = sc.code
        GROUP BY c.code, c.name, c.description, c.display_order
        ORDER BY c.display_order ASC;
      `;
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA categories: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 2. Lấy danh sách 22 phân nhóm chuyên môn kèm tổng số kỹ năng
   */
  async loadSubcategories(
    categoryCode?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaSubcategoryRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<SfiaSubcategoryRawRow[]>`
        SELECT 
          sc.code,
          sc.category_code AS "categoryCode",
          sc.name,
          COALESCE(sc.description, '') AS description,
          sc.display_order AS "displayOrder",
          COUNT(s.code)::int AS "skillCount"
        FROM sfia.subcategories sc
        LEFT JOIN sfia.skills s ON s.subcategory_code = sc.code
        WHERE (${categoryCode ?? null}::text IS NULL OR sc.category_code = ${categoryCode})
        GROUP BY sc.code, sc.category_code, sc.name, sc.description, sc.display_order
        ORDER BY sc.display_order ASC;
      `;
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA subcategories: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 3. Lấy danh sách kỹ năng SFIA có hỗ trợ bộ lọc và đếm số câu hỏi + O*NET
   */
  async loadSkillsWithCounts(
    filters?: {
      categoryCode?: string;
      subcategoryCode?: string;
      level?: number;
      query?: string;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaSkillSummaryRawRow[]> {
    try {
      const conditions: Prisma.Sql[] = [Prisma.sql`1=1`];

      if (filters?.categoryCode) {
        conditions.push(
          Prisma.sql`sc.category_code = ${filters.categoryCode}`,
        );
      }
      if (filters?.subcategoryCode) {
        conditions.push(
          Prisma.sql`s.subcategory_code = ${filters.subcategoryCode}`,
        );
      }
      if (filters?.level) {
        conditions.push(
          Prisma.sql`s.min_level <= ${filters.level} AND s.max_level >= ${filters.level}`,
        );
      }
      if (filters?.query) {
        const pattern = `%${filters.query.trim()}%`;
        conditions.push(
          Prisma.sql`(s.code ILIKE ${pattern} OR s.name ILIKE ${pattern})`,
        );
      }

      const whereClause = Prisma.join(conditions, ' AND ');

      return await this.getClient(tx).$queryRaw<SfiaSkillSummaryRawRow[]>`
        SELECT 
          s.code,
          s.name,
          sc.category_code AS "categoryCode",
          s.subcategory_code AS "subcategoryCode",
          s.min_level AS "minLevel",
          s.max_level AS "maxLevel",
          COUNT(DISTINCT qb.id)::int AS "questionCount",
          COUNT(DISTINCT osm.id)::int AS "onetCount"
        FROM sfia.skills s
        JOIN sfia.subcategories sc ON s.subcategory_code = sc.code
        LEFT JOIN public.question_bank qb ON qb.sfia_skill_code = s.code AND qb.deleted_at IS NULL
        LEFT JOIN public.onet_sfia_mappings osm ON osm.sfia_skill_code = s.code
        WHERE ${whereClause}
        GROUP BY s.code, s.name, sc.category_code, s.subcategory_code, s.min_level, s.max_level
        ORDER BY s.code ASC;
      `;
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA skills with counts: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 4. Lấy thông tin cơ bản của một kỹ năng theo mã code
   */
  async loadSkillDetailBase(
    code: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaSkillDetailBaseRawRow | null> {
    try {
      const rows = await this.getClient(tx).$queryRaw<
        SfiaSkillDetailBaseRawRow[]
      >`
        SELECT 
          s.code,
          s.name,
          sc.category_code AS "categoryCode",
          s.subcategory_code AS "subcategoryCode",
          COALESCE(s.overall_description, '') AS "overallDescription",
          s.guidance_notes AS "guidanceNotes",
          s.min_level AS "minLevel",
          s.max_level AS "maxLevel",
          COUNT(DISTINCT qb.id)::int AS "questionCount",
          COUNT(DISTINCT osm.id)::int AS "onetCount"
        FROM sfia.skills s
        JOIN sfia.subcategories sc ON s.subcategory_code = sc.code
        LEFT JOIN public.question_bank qb ON qb.sfia_skill_code = s.code AND qb.deleted_at IS NULL
        LEFT JOIN public.onet_sfia_mappings osm ON osm.sfia_skill_code = s.code
        WHERE UPPER(s.code) = UPPER(${code})
        GROUP BY s.code, s.name, sc.category_code, s.subcategory_code, s.overall_description, s.guidance_notes, s.min_level, s.max_level
        LIMIT 1;
      `;
      return rows[0] || null;
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA skill detail base for ${code}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 5. Lấy phát biểu năng lực theo từng level của một kỹ năng
   */
  async loadSkillLevels(
    code: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaSkillLevelStatementRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<
        SfiaSkillLevelStatementRawRow[]
      >`
        SELECT 
          sl.skill_code AS "skillCode",
          sl.level_id AS "levelId",
          COALESCE(sl.description, '') AS description,
          l.essence
        FROM sfia.skill_levels sl
        LEFT JOIN sfia.levels l ON sl.level_id = l.level_id
        WHERE UPPER(sl.skill_code) = UPPER(${code})
        ORDER BY sl.level_id ASC;
      `;
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA skill levels for ${code}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 6. Lấy danh sách ánh xạ O*NET liên quan tới kỹ năng
   */
  async loadSkillOnetMappings(
    code: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaOnetMappingRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<SfiaOnetMappingRawRow[]>`
        SELECT 
          osm.onet_soc_code AS "socCode",
          COALESCE(occ.title, osm.onet_soc_code) AS "occupationTitle",
          osm.target_sfia_level AS "targetLevel",
          osm.default_weight::float AS "weight",
          osm.is_core AS "isCore"
        FROM public.onet_sfia_mappings osm
        LEFT JOIN onet.occupation_data occ ON osm.onet_soc_code = occ.onetsoc_code
        WHERE UPPER(osm.sfia_skill_code) = UPPER(${code})
        ORDER BY osm.is_core DESC, osm.target_sfia_level ASC;
      `;
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA O*NET mappings for ${code}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 7. Lấy danh sách câu hỏi phỏng vấn trong ngân hàng câu hỏi
   */
  async loadSkillQuestions(
    code: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaQuestionBankRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<SfiaQuestionBankRawRow[]>`
        SELECT 
          qb.id::text,
          qb.content AS "questionText",
          UPPER(qb.session_type::text) AS "type",
          CASE 
            WHEN qb.difficulty <= 1 THEN 'EASY'
            WHEN qb.difficulty = 2 THEN 'MEDIUM'
            ELSE 'HARD'
          END AS "difficulty",
          qb.target_sfia_level AS "targetSfiaLevel"
        FROM public.question_bank qb
        WHERE UPPER(qb.sfia_skill_code) = UPPER(${code}) AND qb.deleted_at IS NULL
        ORDER BY qb.created_at DESC;
      `;
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA question bank items for ${code}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 8. Lấy 7 cấp độ trách nhiệm SFIA 9
   */
  async loadLevels(
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaLevelRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<SfiaLevelRawRow[]>`
        SELECT 
          level_id AS "levelId",
          name,
          COALESCE(essence, '') AS essence,
          COALESCE(description, '') AS description
        FROM sfia.levels
        ORDER BY level_id ASC;
      `;
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA levels: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 9. Lấy 16 thuộc tính nền tảng SFIA 9
   */
  async loadGenericAttributes(
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaGenericAttributeRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<
        SfiaGenericAttributeRawRow[]
      >`
        SELECT 
          code,
          name,
          COALESCE(description, '') AS description,
          display_order AS "displayOrder"
        FROM sfia.generic_attributes
        ORDER BY display_order ASC;
      `;
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA generic attributes: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 10. Lấy 112 tiêu chuẩn đo lường của thuộc tính qua 7 cấp độ
   */
  async loadGenericAttributeLevels(
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaGenericAttributeLevelRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<
        SfiaGenericAttributeLevelRawRow[]
      >`
        SELECT 
          attribute_code AS "attributeCode",
          level_id AS "levelId",
          COALESCE(description, '') AS description
        FROM sfia.generic_attribute_levels
        ORDER BY attribute_code ASC, level_id ASC;
      `;
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA generic attribute levels: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 11. Lấy dữ liệu ma trận 2D SFIA (ô khả dụng kèm số lượng câu hỏi và O*NET)
   */
  async loadMatrixCells(
    categoryCode?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaMatrixCellRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<SfiaMatrixCellRawRow[]>`
        SELECT 
          sl.skill_code AS "skillCode",
          sl.level_id AS "levelId",
          sl.description AS "statementSnippet",
          COUNT(DISTINCT qb.id)::int AS "questionCount",
          COUNT(DISTINCT osm.id)::int AS "onetCount"
        FROM sfia.skill_levels sl
        JOIN sfia.skills s ON sl.skill_code = s.code
        JOIN sfia.subcategories sc ON s.subcategory_code = sc.code
        LEFT JOIN public.question_bank qb ON qb.sfia_skill_code = sl.skill_code 
             AND qb.target_sfia_level = sl.level_id AND qb.deleted_at IS NULL
        LEFT JOIN public.onet_sfia_mappings osm ON osm.sfia_skill_code = sl.skill_code 
             AND osm.target_sfia_level = sl.level_id
        WHERE (${categoryCode ?? null}::text IS NULL OR sc.category_code = ${categoryCode})
        GROUP BY sl.skill_code, sl.level_id, sl.description;
      `;
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA matrix cells: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 12. Lấy thống kê KPI vĩ mô về độ phủ
   */
  async loadCoverageMetrics(
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaCoverageMetricsRawRow> {
    try {
      const rows = await this.getClient(tx).$queryRaw<
        SfiaCoverageMetricsRawRow[]
      >`
        SELECT 
          (SELECT COUNT(*)::int FROM sfia.skills) AS "totalSkills",
          (SELECT COUNT(*)::int FROM sfia.categories) AS "totalCategories",
          (SELECT COUNT(*)::int FROM sfia.subcategories) AS "totalSubcategories",
          (SELECT COUNT(*)::int FROM sfia.levels) AS "totalLevels",
          (SELECT COUNT(DISTINCT sfia_skill_code)::int FROM public.question_bank WHERE deleted_at IS NULL AND sfia_skill_code IS NOT NULL) AS "skillsWithQuestions",
          (SELECT COUNT(DISTINCT sfia_skill_code)::int FROM public.onet_sfia_mappings WHERE sfia_skill_code IS NOT NULL) AS "skillsWithOnet",
          (SELECT COUNT(*)::int FROM sfia.skills s WHERE NOT EXISTS (
            SELECT 1 FROM public.question_bank qb WHERE qb.sfia_skill_code = s.code AND qb.deleted_at IS NULL
          )) AS "blindSpotsCount",
          (SELECT COUNT(*)::int FROM public.question_bank WHERE deleted_at IS NULL AND sfia_skill_code IS NOT NULL) AS "totalQuestions",
          (SELECT COUNT(*)::int FROM sfia.skill_levels) AS "totalActiveMatrixCells";
      `;

      return (
        rows[0] || {
          totalSkills: 147,
          totalCategories: 6,
          totalSubcategories: 22,
          totalLevels: 7,
          skillsWithQuestions: 0,
          skillsWithOnet: 0,
          blindSpotsCount: 147,
          totalQuestions: 0,
          totalActiveMatrixCells: 672,
        }
      );
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA coverage metrics: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 13. Lấy phân bổ câu hỏi và nghề O*NET theo 6 danh mục lớn
   */
  async loadCategoryDistribution(
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaCategoryMetricRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<
        SfiaCategoryMetricRawRow[]
      >`
        SELECT 
          c.code,
          c.name,
          COUNT(DISTINCT s.code)::int AS "skillCount",
          COUNT(DISTINCT qb.id)::int AS "questionCount",
          COUNT(DISTINCT osm.onet_soc_code)::int AS "mappedOnetCount"
        FROM sfia.categories c
        LEFT JOIN sfia.subcategories sc ON sc.category_code = c.code
        LEFT JOIN sfia.skills s ON s.subcategory_code = sc.code
        LEFT JOIN public.question_bank qb ON qb.sfia_skill_code = s.code AND qb.deleted_at IS NULL
        LEFT JOIN public.onet_sfia_mappings osm ON osm.sfia_skill_code = s.code
        GROUP BY c.code, c.name, c.display_order
        ORDER BY c.display_order ASC;
      `;
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA category distribution: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 14. Lấy phân bổ câu hỏi theo 7 cấp độ trách nhiệm
   */
  async loadLevelDistribution(
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaLevelMetricRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<SfiaLevelMetricRawRow[]>`
        SELECT 
          l.level_id AS "level",
          l.name,
          COUNT(DISTINCT sl.skill_code)::int AS "activeCellCount",
          COUNT(DISTINCT qb.id)::int AS "questionCount"
        FROM sfia.levels l
        LEFT JOIN sfia.skill_levels sl ON sl.level_id = l.level_id
        LEFT JOIN public.question_bank qb ON qb.target_sfia_level = l.level_id AND qb.deleted_at IS NULL
        GROUP BY l.level_id, l.name
        ORDER BY l.level_id ASC;
      `;
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA level distribution: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 15. Lấy danh sách Top kỹ năng SFIA được ánh xạ nhiều nhất trong O*NET
   */
  async loadTopOnetMappedSkills(
    limit = 10,
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaTopOnetMappedSkillRawRow[]> {
    try {
      return await this.getClient(tx).$queryRaw<
        SfiaTopOnetMappedSkillRawRow[]
      >`
        SELECT 
          s.code AS "skillCode",
          s.name AS "skillName",
          sc.category_code AS "categoryCode",
          COUNT(DISTINCT osm.onet_soc_code)::int AS "onetCount",
          COUNT(DISTINCT CASE WHEN osm.is_core = TRUE THEN osm.onet_soc_code END)::int AS "coreCount",
          COUNT(DISTINCT qb.id)::int AS "questionCount"
        FROM sfia.skills s
        JOIN sfia.subcategories sc ON s.subcategory_code = sc.code
        JOIN public.onet_sfia_mappings osm ON osm.sfia_skill_code = s.code
        LEFT JOIN public.question_bank qb ON qb.sfia_skill_code = s.code AND qb.deleted_at IS NULL
        GROUP BY s.code, s.name, sc.category_code
        ORDER BY "onetCount" DESC, "coreCount" DESC
        LIMIT ${limit};
      `;
    } catch (error) {
      this.logger.error(
        `Failed to query SFIA top ONET mapped skills: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 16. Thêm một câu hỏi phỏng vấn mới gắn nhãn SFIA vào question_bank
   */
  async createQuestion(
    data: {
      content: string;
      sessionType: 'technical' | 'hr';
      difficulty: number;
      sfiaSkillCode: string;
      targetSfiaLevel: number;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaQuestionBankRawRow> {
    try {
      const client = this.getClient(tx);
      const sessionType =
        data.sessionType === 'technical'
          ? QuestionSessionType.technical
          : QuestionSessionType.hr;

      const created = await client.questionBank.create({
        data: {
          content: data.content,
          sessionType,
          difficulty: data.difficulty,
          contextPackId: 'sfia-v9',
          sfiaSkillCode: data.sfiaSkillCode,
          targetSfiaLevel: data.targetSfiaLevel,
        },
      });

      return {
        id: created.id,
        questionText: created.content,
        type: created.sessionType.toUpperCase(),
        difficulty:
          created.difficulty <= 1
            ? 'EASY'
            : created.difficulty === 2
              ? 'MEDIUM'
              : 'HARD',
        targetSfiaLevel: created.targetSfiaLevel ?? data.targetSfiaLevel,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create question for SFIA skill ${data.sfiaSkillCode}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
