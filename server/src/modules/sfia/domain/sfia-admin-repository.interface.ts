import { Prisma } from '@prisma/client';
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
} from '../repositories/types/sfia-admin-raw-row.types';

export const SFIA_ADMIN_REPOSITORY_TOKEN = Symbol('ISfiaAdminRepository');

export interface ISfiaAdminRepository {
  /**
   * Lấy danh sách toàn bộ 6 danh mục SFIA 9 kèm số lượng kỹ năng
   */
  loadCategories(tx?: Prisma.TransactionClient): Promise<SfiaCategoryRawRow[]>;

  /**
   * Lấy danh sách 22 phân nhóm chuyên môn SFIA 9 kèm số lượng kỹ năng
   */
  loadSubcategories(
    categoryCode?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaSubcategoryRawRow[]>;

  /**
   * Lấy danh sách kỹ năng SFIA có tính toán số lượng câu hỏi và nghề O*NET
   */
  loadSkillsWithCounts(
    filters?: {
      categoryCode?: string;
      subcategoryCode?: string;
      level?: number;
      query?: string;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaSkillSummaryRawRow[]>;

  /**
   * Lấy thông tin cơ bản của một kỹ năng theo mã code
   */
  loadSkillDetailBase(
    code: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaSkillDetailBaseRawRow | null>;

  /**
   * Lấy danh sách phát biểu năng lực hành vi theo các cấp độ của một kỹ năng
   */
  loadSkillLevels(
    code: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaSkillLevelStatementRawRow[]>;

  /**
   * Lấy danh sách ánh xạ nghề nghiệp O*NET của một kỹ năng
   */
  loadSkillOnetMappings(
    code: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaOnetMappingRawRow[]>;

  /**
   * Lấy danh sách câu hỏi phỏng vấn trong ngân hàng câu hỏi gắn với kỹ năng này
   */
  loadSkillQuestions(
    code: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaQuestionBankRawRow[]>;

  /**
   * Lấy danh sách 7 cấp độ trách nhiệm chuẩn SFIA 9
   */
  loadLevels(tx?: Prisma.TransactionClient): Promise<SfiaLevelRawRow[]>;

  /**
   * Lấy danh sách 16 thuộc tính năng lực chung
   */
  loadGenericAttributes(
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaGenericAttributeRawRow[]>;

  /**
   * Lấy 112 tiêu chuẩn đo lường của các thuộc tính qua 7 cấp độ
   */
  loadGenericAttributeLevels(
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaGenericAttributeLevelRawRow[]>;

  /**
   * Lấy dữ liệu tất cả các ô ma trận SFIA khả dụng
   */
  loadMatrixCells(
    categoryCode?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaMatrixCellRawRow[]>;

  /**
   * Lấy các chỉ số KPI tổng quan độ phủ
   */
  loadCoverageMetrics(
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaCoverageMetricsRawRow>;

  /**
   * Lấy phân bổ câu hỏi và nghề O*NET theo 6 danh mục lớn
   */
  loadCategoryDistribution(
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaCategoryMetricRawRow[]>;

  /**
   * Lấy phân bổ câu hỏi theo 7 cấp độ trách nhiệm
   */
  loadLevelDistribution(
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaLevelMetricRawRow[]>;

  /**
   * Lấy danh sách Top kỹ năng SFIA được map nhiều nhất trong O*NET
   */
  loadTopOnetMappedSkills(
    limit?: number,
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaTopOnetMappedSkillRawRow[]>;

  /**
   * Thêm một câu hỏi phỏng vấn mới gắn nhãn kỹ năng và level SFIA vào question_bank
   */
  createQuestion(
    data: {
      content: string;
      sessionType: 'technical' | 'hr';
      difficulty: number;
      sfiaSkillCode: string;
      targetSfiaLevel: number;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<SfiaQuestionBankRawRow>;
}
