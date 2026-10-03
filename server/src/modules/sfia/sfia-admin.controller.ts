import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '@core/common/decorators';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '@core/common/swagger/api-error-responses.decorator';
import { SfiaAdminService } from './sfia-admin.service';
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

/**
 * SfiaAdminController — 10 Admin REST endpoints cho SFIA 9 Knowledge Base
 *
 * Base route: /admin/sfia
 * Authorization: @Roles(UserRole.admin) — JWT + Cookie required
 */
@Controller('admin/sfia')
@Roles(UserRole.admin)
@ApiTags('SFIA Admin')
@ApiCookieAuth('cookieAuth')
@ApiBearerAuth('jwtAuth')
export class SfiaAdminController {
  constructor(private readonly sfiaAdminService: SfiaAdminService) {}

  /**
   * 1. GET /admin/sfia/taxonomy
   * Lấy toàn bộ cây phân loại SFIA 9 (Categories + Subcategories + Skills)
   * dùng để khởi tạo sidebar, filter panel và tree view của admin UI.
   */
  @Get('taxonomy')
  @ApiOperation({
    summary: 'Get full SFIA 9 taxonomy tree',
    description:
      'Returns the full taxonomy tree: 6 categories, 22 subcategories, 147 skills with level ranges and question/O*NET counts.',
  })
  @ApiOkResponse({
    description: 'Full SFIA 9 taxonomy successfully retrieved',
    type: SfiaTaxonomyResponseDto,
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async getTaxonomy(): Promise<SfiaTaxonomyResponseDto> {
    return await this.sfiaAdminService.getTaxonomy();
  }

  /**
   * 2. GET /admin/sfia/categories
   * Lấy danh sách 6 danh mục lớn SFIA 9 kèm số lượng kỹ năng.
   */
  @Get('categories')
  @ApiOperation({
    summary: 'Get all 6 SFIA 9 categories',
    description:
      'Returns the 6 top-level SFIA 9 categories with skill counts. Served from In-Memory cache when available.',
  })
  @ApiOkResponse({
    description: 'List of SFIA 9 categories',
    type: [SfiaCategoryDto],
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async getCategories(): Promise<SfiaCategoryDto[]> {
    return await this.sfiaAdminService.getCategories();
  }

  /**
   * 3. GET /admin/sfia/subcategories
   * Lấy danh sách 22 phân nhóm chuyên môn (có thể lọc theo category).
   */
  @Get('subcategories')
  @ApiOperation({
    summary: 'Get SFIA 9 subcategories',
    description:
      'Returns up to 22 professional subcategories. Optionally filter by categoryCode.',
  })
  @ApiQuery({
    name: 'categoryCode',
    required: false,
    description: 'Mã danh mục lớn để lọc (ví dụ: DEV_IMPL)',
    example: 'DEV_IMPL',
  })
  @ApiOkResponse({
    description: 'List of SFIA 9 subcategories',
    type: [SfiaSubcategoryDto],
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async getSubcategories(
    @Query('categoryCode') categoryCode?: string,
  ): Promise<SfiaSubcategoryDto[]> {
    return await this.sfiaAdminService.getSubcategories(categoryCode);
  }

  /**
   * 4. GET /admin/sfia/skills
   * Lấy danh sách kỹ năng SFIA có bộ lọc (category, subcategory, level, query text).
   */
  @Get('skills')
  @ApiOperation({
    summary: 'Get SFIA skills with optional filters',
    description:
      'Returns all 147 SFIA skills with question and O*NET mapping counts. Supports filtering by categoryCode, subcategoryCode, level (1-7), and text search query.',
  })
  @ApiOkResponse({
    description: 'List of SFIA skill summaries matching filters',
    type: [SfiaSkillSummaryDto],
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async getSkills(
    @Query() filters: SfiaSkillFiltersQueryDto,
  ): Promise<SfiaSkillSummaryDto[]> {
    return await this.sfiaAdminService.getSkills(filters);
  }

  /**
   * 5. GET /admin/sfia/skills/:code
   * Lấy chi tiết toàn diện của một kỹ năng: level statements, O*NET mappings, question bank.
   */
  @Get('skills/:code')
  @ApiOperation({
    summary: 'Get full detail of a single SFIA skill',
    description:
      'Returns complete skill detail including per-level behavioural statements, linked O*NET occupations, and question bank items.',
  })
  @ApiParam({
    name: 'code',
    description: 'Mã kỹ năng SFIA 4 chữ cái (ví dụ: PROG, SWDN)',
    example: 'PROG',
  })
  @ApiOkResponse({
    description: 'Full SFIA skill detail',
    type: SfiaSkillDetailDto,
  })
  @ApiCommonErrors(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
  )
  async getSkillDetail(
    @Param('code') code: string,
  ): Promise<SfiaSkillDetailDto> {
    return await this.sfiaAdminService.getSkillDetail(code);
  }

  /**
   * 6. GET /admin/sfia/levels
   * Lấy danh sách 7 cấp độ trách nhiệm chuẩn SFIA 9.
   */
  @Get('levels')
  @ApiOperation({
    summary: 'Get all 7 SFIA 9 responsibility levels',
    description:
      'Returns the 7 standard SFIA responsibility levels with name, essence, and full description. Served from In-Memory cache when available.',
  })
  @ApiOkResponse({
    description: 'List of 7 SFIA responsibility levels',
    type: [SfiaLevelResponsibilityDto],
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async getResponsibilityLevels(): Promise<SfiaLevelResponsibilityDto[]> {
    return await this.sfiaAdminService.getResponsibilityLevels();
  }

  /**
   * 7. GET /admin/sfia/generic-attributes
   * Lấy danh sách thuộc tính chung (Autonomy, Influence, Complexity,...) và tiêu chuẩn đo lường qua 7 levels.
   */
  @Get('generic-attributes')
  @ApiOperation({
    summary: 'Get SFIA generic attributes with level standards',
    description:
      'Returns up to 16 generic attributes (e.g. AUTONOMY, INFLUENCE, COMPLEXITY) each with per-level behavioural standards (7 levels).',
  })
  @ApiOkResponse({
    description: 'List of SFIA generic attributes with level criteria',
    type: [SfiaGenericAttributeDto],
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async getGenericAttributes(): Promise<SfiaGenericAttributeDto[]> {
    return await this.sfiaAdminService.getGenericAttributes();
  }

  /**
   * 8. GET /admin/sfia/matrix
   * Lấy toàn bộ dữ liệu 2D matrix (147 kỹ năng x 7 levels) với trạng thái từng ô.
   */
  @Get('matrix')
  @ApiOperation({
    summary: 'Get 2D SFIA skills matrix (147 x 7)',
    description:
      'Returns the full 147 skills × 7 levels matrix. Each cell indicates availability, question count, O*NET count, and a statement snippet. Optionally filter by categoryCode to reduce payload size.',
  })
  @ApiQuery({
    name: 'categoryCode',
    required: false,
    description: 'Lọc ma trận theo danh mục (ví dụ: DEV_IMPL)',
    example: 'DEV_IMPL',
  })
  @ApiOkResponse({
    description: 'SFIA 2D matrix data',
    type: SfiaMatrixResponseDto,
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async getMatrixData(
    @Query('categoryCode') categoryCode?: string,
  ): Promise<SfiaMatrixResponseDto> {
    return await this.sfiaAdminService.getMatrixData(categoryCode);
  }

  /**
   * 9. GET /admin/sfia/analytics/coverage (hỗ trợ alias /admin/sfia/coverage)
   * Lấy số liệu thống kê KPI độ phủ câu hỏi + O*NET toàn bộ SFIA.
   */
  @Get(['analytics/coverage', 'coverage'])
  @ApiOperation({
    summary: 'Get SFIA question coverage KPI statistics',
    description:
      'Returns aggregate coverage stats: total skills, skills with questions/O*NET, blind spots count, category distribution, level distribution, and top O*NET-mapped skills.',
  })
  @ApiOkResponse({
    description: 'SFIA coverage statistics',
    type: SfiaCoverageStatsDto,
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async getCoverageStats(): Promise<SfiaCoverageStatsDto> {
    return await this.sfiaAdminService.getCoverageStats();
  }

  /**
   * 10. POST /admin/sfia/skills/:code/questions
   * Tạo câu hỏi phỏng vấn mới gắn nhãn kỹ năng và level SFIA.
   */
  @Post('skills/:code/questions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new interview question tagged with SFIA skill and level',
    description:
      "Creates a new question in the question bank and tags it with the specified SFIA skill code and target level. Validates that the target level is within the skill's min–max level range.",
  })
  @ApiParam({
    name: 'code',
    description: 'Mã kỹ năng SFIA (ví dụ: PROG)',
    example: 'PROG',
  })
  @ApiBody({ type: CreateSfiaQuestionDto })
  @ApiCreatedResponse({
    description: 'Interview question created and tagged successfully',
    type: SfiaQuestionBankItemDto,
  })
  @ApiCommonErrors(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
  )
  async createQuestion(
    @Param('code') code: string,
    @Body() dto: CreateSfiaQuestionDto,
  ): Promise<SfiaQuestionBankItemDto> {
    return await this.sfiaAdminService.createQuestion(code, dto);
  }
}
