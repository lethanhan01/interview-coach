import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// ============================================================================
// 1. CATEGORY & SUBCATEGORY DTOS
// ============================================================================

export class SfiaCategoryDto {
  @ApiProperty({ example: 'DEV_IMPL' })
  code!: string;

  @ApiProperty({ example: 'Development and implementation' })
  name!: string;

  @ApiProperty({ example: 'Phát triển & Triển khai' })
  nameVi!: string;

  @ApiProperty({ example: 'Thiết kế, xây dựng, kiểm thử...' })
  description!: string;

  @ApiProperty({ example: 3 })
  displayOrder!: number;

  @ApiProperty({ example: 42 })
  skillCount!: number;
}

export class SfiaSubcategoryDto {
  @ApiProperty({ example: 'SYSDEV' })
  code!: string;

  @ApiProperty({ example: 'DEV_IMPL' })
  categoryCode!: string;

  @ApiProperty({ example: 'Systems development' })
  name!: string;

  @ApiProperty({ example: 'Phát triển hệ thống' })
  nameVi!: string;

  @ApiProperty({ example: 'Phân nhóm phát triển phần mềm...' })
  description!: string;

  @ApiPropertyOptional({ example: 1 })
  displayOrder?: number;

  @ApiProperty({ example: 12 })
  skillCount!: number;
}

// ============================================================================
// 2. SKILL SUMMARY & QUERY DTOS
// ============================================================================

export class SfiaSkillSummaryDto {
  @ApiProperty({ example: 'PROG' })
  code!: string;

  @ApiProperty({ example: 'Programming/software development' })
  name!: string;

  @ApiProperty({ example: 'DEV_IMPL' })
  categoryCode!: string;

  @ApiProperty({ example: 'SYSDEV' })
  subcategoryCode!: string;

  @ApiProperty({ example: 2 })
  minLevel!: number;

  @ApiProperty({ example: 6 })
  maxLevel!: number;

  @ApiProperty({ example: 15 })
  questionCount!: number;

  @ApiProperty({ example: 8 })
  onetCount!: number;
}

export class SfiaSkillFiltersQueryDto {
  @ApiPropertyOptional({
    description: 'Mã danh mục SFIA lớn (ví dụ: DEV_IMPL)',
  })
  @IsOptional()
  @IsString()
  categoryCode?: string;

  @ApiPropertyOptional({ description: 'Mã phân nhóm SFIA (ví dụ: SYSDEV)' })
  @IsOptional()
  @IsString()
  subcategoryCode?: string;

  @ApiPropertyOptional({
    description: 'Lọc kỹ năng khả dụng tại Cấp độ (1-7)',
    minimum: 1,
    maximum: 7,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  level?: number;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm theo mã code hoặc tên',
  })
  @IsOptional()
  @IsString()
  query?: string;
}

// ============================================================================
// 3. SKILL DETAIL & SYSTEM LINKED ITEMS
// ============================================================================

export class SfiaSkillLevelStatementDto {
  @ApiProperty({ example: 'PROG' })
  skillCode!: string;

  @ApiProperty({ example: 3 })
  levelId!: number;

  @ApiProperty({
    example: 'Applies software engineering and testing principles...',
  })
  description!: string;

  @ApiPropertyOptional({
    example: 'Applies knowledge and skills to perform tasks...',
  })
  essence?: string;
}

export class SfiaOnetMappingItemDto {
  @ApiProperty({ example: '15-1252.00' })
  socCode!: string;

  @ApiProperty({ example: 'Software Developers' })
  occupationTitle!: string;

  @ApiProperty({ example: 3 })
  targetLevel!: number;

  @ApiProperty({ example: 1.0 })
  weight!: number;

  @ApiProperty({ example: true })
  isCore!: boolean;
}

export class SfiaQuestionBankItemDto {
  @ApiProperty({ example: 'q-1234-uuid' })
  id!: string;

  @ApiProperty({ example: 'Giải thích cơ chế Event Loop trong Node.js' })
  questionText!: string;

  @ApiProperty({
    example: 'TECHNICAL',
    enum: ['TECHNICAL', 'BEHAVIORAL', 'SITUATIONAL', 'HR'],
  })
  type!: 'TECHNICAL' | 'BEHAVIORAL' | 'SITUATIONAL' | 'HR';

  @ApiProperty({ example: 'MEDIUM', enum: ['EASY', 'MEDIUM', 'HARD'] })
  difficulty!: 'EASY' | 'MEDIUM' | 'HARD';

  @ApiProperty({ example: 3 })
  targetSfiaLevel!: number;
}

export class SfiaSkillDetailDto extends SfiaSkillSummaryDto {
  @ApiProperty({
    example: 'The planning, designing, creation, amending, verification...',
  })
  overallDescription!: string;

  @ApiPropertyOptional({
    example: 'Relevant to software engineering across all platforms...',
  })
  guidanceNotes?: string;

  @ApiProperty({ type: [SfiaSkillLevelStatementDto] })
  skillLevels!: SfiaSkillLevelStatementDto[];

  @ApiProperty({ type: [SfiaOnetMappingItemDto] })
  onetMappings!: SfiaOnetMappingItemDto[];

  @ApiProperty({ type: [SfiaQuestionBankItemDto] })
  questionBankItems!: SfiaQuestionBankItemDto[];
}

// ============================================================================
// 4. TAXONOMY COMPOSITE RESPONSE DTO
// ============================================================================

export class SfiaTaxonomyResponseDto {
  @ApiProperty({ type: [SfiaCategoryDto] })
  categories!: SfiaCategoryDto[];

  @ApiProperty({ type: [SfiaSubcategoryDto] })
  subcategories!: SfiaSubcategoryDto[];

  @ApiProperty({ type: [SfiaSkillSummaryDto] })
  skills!: SfiaSkillSummaryDto[];
}

// ============================================================================
// 5. RESPONSIBILITY LEVELS & GENERIC ATTRIBUTES
// ============================================================================

export class SfiaLevelResponsibilityDto {
  @ApiProperty({ example: 3 })
  levelId!: number;

  @ApiProperty({ example: 'Apply' })
  name!: string;

  @ApiProperty({ example: 'Áp dụng độc lập' })
  nameVi!: string;

  @ApiProperty({ example: 'Applies knowledge and skills to perform tasks...' })
  essence!: string;

  @ApiProperty({
    example:
      'Works under general direction. Uses discretion in identifying and resolving problems...',
  })
  description!: string;
}

export class SfiaGenericAttributeDto {
  @ApiProperty({ example: 'AUTONOMY' })
  code!: string;

  @ApiProperty({ example: 'Autonomy' })
  name!: string;

  @ApiProperty({ example: 'Mức độ tự chủ' })
  nameVi!: string;

  @ApiProperty({ example: 'Quyền hạn và mức độ giám sát độc lập...' })
  description!: string;

  @ApiProperty({
    example: {
      1: 'Works under close supervision.',
      2: 'Works under routine direction.',
      3: 'Works under general direction.',
    },
    description: 'Bản mô tả tiêu chuẩn hành vi qua các levels 1-7',
  })
  levels!: Record<number, string>;
}

// ============================================================================
// 6. 2D MATRIX GRID DTOS
// ============================================================================

export class SfiaMatrixCellDataDto {
  @ApiProperty({ example: 'PROG' })
  skillCode!: string;

  @ApiProperty({ example: 3 })
  levelId!: number;

  @ApiProperty({ example: true })
  isAvailable!: boolean;

  @ApiProperty({ example: 4 })
  questionCount!: number;

  @ApiProperty({ example: 2 })
  onetCount!: number;

  @ApiPropertyOptional({
    example: 'Applies software engineering principles...',
  })
  statementSnippet?: string;
}

export class SfiaMatrixResponseDto {
  @ApiProperty({ type: [SfiaSkillSummaryDto] })
  skills!: SfiaSkillSummaryDto[];

  @ApiProperty({ type: [SfiaCategoryDto] })
  categories!: SfiaCategoryDto[];

  @ApiProperty({
    description:
      'Từ điển tra cứu trạng thái ô với key định dạng {skillCode}_L{levelId}',
    example: {
      PROG_L3: {
        skillCode: 'PROG',
        levelId: 3,
        isAvailable: true,
        questionCount: 4,
        onetCount: 2,
      },
    },
  })
  cells!: Record<string, SfiaMatrixCellDataDto>;
}

// ============================================================================
// 7. COVERAGE ANALYTICS & BLIND SPOTS DTOS
// ============================================================================

export class SfiaCategoryMetricDto {
  @ApiProperty({ example: 'DEV_IMPL' })
  code!: string;

  @ApiProperty({ example: 'Development and implementation' })
  name!: string;

  @ApiProperty({ example: 'Phát triển & Triển khai' })
  nameVi!: string;

  @ApiProperty({ example: 42 })
  skillCount!: number;

  @ApiProperty({ example: 120 })
  questionCount!: number;

  @ApiProperty({ example: 35 })
  mappedOnetCount!: number;
}

export class SfiaLevelMetricDto {
  @ApiProperty({ example: 3 })
  level!: number;

  @ApiProperty({ example: 'Level 3 — Apply' })
  name!: string;

  @ApiProperty({ example: 'L3 Apply' })
  shortName!: string;

  @ApiProperty({ example: 85 })
  activeCellCount!: number;

  @ApiProperty({ example: 140 })
  questionCount!: number;
}

export class SfiaTopOnetMappedSkillDto {
  @ApiProperty({ example: 'PROG' })
  skillCode!: string;

  @ApiProperty({ example: 'Programming/software development' })
  skillName!: string;

  @ApiProperty({ example: 'DEV_IMPL' })
  categoryCode!: string;

  @ApiProperty({ example: 12 })
  onetCount!: number;

  @ApiProperty({ example: 8 })
  coreCount!: number;

  @ApiProperty({ example: 25 })
  questionCount!: number;
}

export class SfiaCoverageStatsDto {
  @ApiProperty({ example: 147 })
  totalSkills!: number;

  @ApiProperty({ example: 6 })
  totalCategories!: number;

  @ApiProperty({ example: 22 })
  totalSubcategories!: number;

  @ApiProperty({ example: 7 })
  totalLevels!: number;

  @ApiProperty({ example: 98 })
  skillsWithQuestions!: number;

  @ApiProperty({ example: 75 })
  skillsWithOnet!: number;

  @ApiProperty({ example: 49 })
  blindSpotsCount!: number;

  @ApiProperty({ example: 340 })
  totalQuestions!: number;

  @ApiProperty({ example: 672 })
  totalActiveMatrixCells!: number;

  @ApiProperty({ type: [SfiaCategoryMetricDto] })
  categoryDistribution!: SfiaCategoryMetricDto[];

  @ApiProperty({ type: [SfiaLevelMetricDto] })
  levelDistribution!: SfiaLevelMetricDto[];

  @ApiProperty({ type: [SfiaTopOnetMappedSkillDto] })
  topOnetMappedSkills!: SfiaTopOnetMappedSkillDto[];
}

// ============================================================================
// 8. QUESTION CREATION PAYLOAD DTO
// ============================================================================

export class CreateSfiaQuestionDto {
  @ApiProperty({
    description: 'Nội dung câu hỏi phỏng vấn chi tiết',
    example:
      'Giải thích nguyên lý Event Loop trong Node.js và cách tối ưu I/O throughput.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung câu hỏi không được để trống' })
  questionText!: string;

  @ApiProperty({
    description: 'Loại câu hỏi phỏng vấn',
    enum: ['TECHNICAL', 'HR', 'BEHAVIORAL', 'SITUATIONAL'],
    example: 'TECHNICAL',
  })
  @IsEnum(['TECHNICAL', 'HR', 'BEHAVIORAL', 'SITUATIONAL'], {
    message:
      'Loại câu hỏi phải là một trong: TECHNICAL, HR, BEHAVIORAL, SITUATIONAL',
  })
  type!: 'TECHNICAL' | 'HR' | 'BEHAVIORAL' | 'SITUATIONAL';

  @ApiProperty({
    description: 'Mức độ khó của câu hỏi',
    enum: ['EASY', 'MEDIUM', 'HARD'],
    example: 'MEDIUM',
  })
  @IsEnum(['EASY', 'MEDIUM', 'HARD'], {
    message: 'Độ khó phải là một trong: EASY, MEDIUM, HARD',
  })
  difficulty!: 'EASY' | 'MEDIUM' | 'HARD';

  @ApiProperty({
    description: 'Cấp độ SFIA mục tiêu của câu hỏi (từ 1 đến 7)',
    example: 3,
    minimum: 1,
    maximum: 7,
  })
  @Type(() => Number)
  @IsInt({ message: 'Cấp độ SFIA mục tiêu phải là số nguyên' })
  @Min(1, { message: 'Cấp độ SFIA tối thiểu là 1' })
  @Max(7, { message: 'Cấp độ SFIA tối đa là 7' })
  targetSfiaLevel!: number;
}
