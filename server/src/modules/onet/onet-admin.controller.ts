import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '@core/common/decorators';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '@core/common/swagger/api-error-responses.decorator';
import { OnetAdminService } from './onet-admin.service';
import {
  OnetAnalyticsSummaryDto,
  SocGroupDistributionItemDto,
  OnetTopOccupationItemDto,
  OnetTopOccupationsQueryDto,
  SfiaSkillCoverageItemDto,
  OnetSearchOccupationsQueryDto,
  OnetOccupationSummaryDto,
  OnetOccupationDetailDto,
  OnetAlternateTitlesQueryDto,
  PaginatedAlternateTitlesDto,
  OnetSfiaMappingItemDto,
  CreateOnetSfiaMappingDto,
  UpdateOnetSfiaMappingDto,
  SfiaLibrarySkillDto,
} from './dto/onet-admin.dto';

@Controller('onet/admin')
@Roles(UserRole.admin)
@ApiTags('O*NET Admin')
@ApiCookieAuth('cookieAuth')
@ApiBearerAuth('jwtAuth')
export class OnetAdminController {
  constructor(private readonly onetAdminService: OnetAdminService) {}

  /**
   * 1. Lấy thông tin thống kê KPI vĩ mô cho Analytics Dashboard
   */
  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get macro KPI summary stats for O*NET Admin' })
  @ApiOkResponse({
    description:
      'System-wide summary metrics for occupations, mappings, and skills',
    type: OnetAnalyticsSummaryDto,
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async getAnalyticsSummary(): Promise<OnetAnalyticsSummaryDto> {
    return await this.onetAdminService.getAnalyticsSummary();
  }

  /**
   * 2. Lấy phân bổ 23 nhóm nghề Major Groups SOC
   */
  @Get('analytics/major-groups')
  @ApiOperation({ summary: 'Get 23 SOC Major Groups distribution' })
  @ApiOkResponse({
    description: 'Distribution list of 23 Major Groups with mapping coverage',
    type: [SocGroupDistributionItemDto],
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async getMajorGroupsDistribution(): Promise<SocGroupDistributionItemDto[]> {
    return await this.onetAdminService.getMajorGroupsDistribution();
  }

  /**
   * 3. Lấy danh sách Top nghề quan tâm nhất
   */
  @Get('analytics/top-occupations')
  @ApiOperation({
    summary: 'Get top occupations by mock interviews and linked JDs',
  })
  @ApiOkResponse({
    description: 'List of top occupations ranked by user activity',
    type: [OnetTopOccupationItemDto],
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async getTopOccupations(
    @Query() query: OnetTopOccupationsQueryDto,
  ): Promise<OnetTopOccupationItemDto[]> {
    return await this.onetAdminService.getTopOccupations(query);
  }

  /**
   * 4. Lấy phân bổ độ phủ kỹ năng SFIA
   */
  @Get('analytics/sfia-coverage')
  @ApiOperation({ summary: 'Get SFIA skills mapping coverage distribution' })
  @ApiOkResponse({
    description:
      'Distribution of SFIA skills coverage across mapped occupations',
    type: [SfiaSkillCoverageItemDto],
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async getSfiaSkillCoverage(
    @Query('limit') limit?: number,
    @Query('category') category?: string,
  ): Promise<SfiaSkillCoverageItemDto[]> {
    return await this.onetAdminService.getSfiaSkillCoverage(limit, category);
  }

  /**
   * 5. Tìm kiếm và lọc danh sách nghề nghiệp cho Sidebar
   */
  @Get('occupations')
  @ApiOperation({ summary: 'Search and filter occupations for Admin Sidebar' })
  @ApiOkResponse({
    description: 'List of occupations matching search and filter criteria',
    type: [OnetOccupationSummaryDto],
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async searchOccupations(
    @Query() query: OnetSearchOccupationsQueryDto,
  ): Promise<OnetOccupationSummaryDto[]> {
    return await this.onetAdminService.searchOccupations(query);
  }

  /**
   * 6. Lấy chi tiết một nghề nghiệp theo mã SOC (Job Zone, Tech skills, Tasks counts)
   */
  @Get('occupations/:socCode')
  @ApiOperation({
    summary:
      'Get full occupation detail with job zone, tech skills and task counts',
  })
  @ApiParam({ name: 'socCode', example: '15-1252.00' })
  @ApiOkResponse({
    description: 'Detailed occupation data with taxonomy references',
    type: OnetOccupationDetailDto,
  })
  @ApiCommonErrors(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
  )
  async getOccupationDetail(
    @Param('socCode') socCode: string,
  ): Promise<OnetOccupationDetailDto> {
    return await this.onetAdminService.getOccupationDetail(socCode);
  }

  /**
   * 7. Lấy danh sách chức danh thị trường (Alternate Job Titles) có phân trang
   */
  @Get('occupations/:socCode/alternate-titles')
  @ApiOperation({
    summary: 'Get paginated alternate job titles for an occupation',
  })
  @ApiParam({ name: 'socCode', example: '15-1252.00' })
  @ApiOkResponse({
    description: 'Paginated alternate titles for the occupation',
    type: PaginatedAlternateTitlesDto,
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async getAlternateTitles(
    @Param('socCode') socCode: string,
    @Query() query: OnetAlternateTitlesQueryDto,
  ): Promise<PaginatedAlternateTitlesDto> {
    return await this.onetAdminService.getOccupationAlternateTitles(
      socCode,
      query,
    );
  }

  /**
   * 8. Lấy danh sách ánh xạ kỹ năng SFIA của một nghề
   */
  @Get('occupations/:socCode/sfia-mappings')
  @ApiOperation({ summary: 'Get SFIA skill mappings for an occupation' })
  @ApiParam({ name: 'socCode', example: '15-1252.00' })
  @ApiOkResponse({
    description: 'List of SFIA skill mappings linked to the occupation',
    type: [OnetSfiaMappingItemDto],
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async getOccupationSfiaMappings(
    @Param('socCode') socCode: string,
  ): Promise<OnetSfiaMappingItemDto[]> {
    return await this.onetAdminService.getOccupationSfiaMappings(socCode);
  }

  /**
   * 9. Thêm mới ánh xạ SFIA cho một nghề
   */
  @Post('occupations/:socCode/sfia-mappings')
  @ApiOperation({ summary: 'Create a new SFIA mapping for an occupation' })
  @ApiParam({ name: 'socCode', example: '15-1252.00' })
  @ApiCreatedResponse({
    description: 'SFIA mapping created successfully',
    type: OnetSfiaMappingItemDto,
  })
  @ApiCommonErrors(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.CONFLICT,
  )
  async createSfiaMapping(
    @Param('socCode') socCode: string,
    @Body() dto: CreateOnetSfiaMappingDto,
  ): Promise<OnetSfiaMappingItemDto> {
    return await this.onetAdminService.createSfiaMapping(socCode, dto);
  }

  /**
   * 10. Chỉnh sửa ánh xạ SFIA (Level, Weight, isCore)
   */
  @Patch('occupations/:socCode/sfia-mappings/:mappingId')
  @ApiOperation({ summary: 'Update an existing SFIA mapping' })
  @ApiParam({ name: 'socCode', example: '15-1252.00' })
  @ApiParam({ name: 'mappingId', example: 'map_123' })
  @ApiOkResponse({
    description: 'SFIA mapping updated successfully',
    type: OnetSfiaMappingItemDto,
  })
  @ApiCommonErrors(
    HttpStatus.BAD_REQUEST,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
  )
  async updateSfiaMapping(
    @Param('socCode') socCode: string,
    @Param('mappingId') mappingId: string,
    @Body() dto: UpdateOnetSfiaMappingDto,
  ): Promise<OnetSfiaMappingItemDto> {
    return await this.onetAdminService.updateSfiaMapping(
      socCode,
      mappingId,
      dto,
    );
  }

  /**
   * 11. Xóa ánh xạ SFIA
   */
  @Delete('occupations/:socCode/sfia-mappings/:mappingId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an SFIA mapping' })
  @ApiParam({ name: 'socCode', example: '15-1252.00' })
  @ApiParam({ name: 'mappingId', example: 'map_123' })
  @ApiOkResponse({
    description: 'SFIA mapping deleted successfully',
  })
  @ApiCommonErrors(
    HttpStatus.UNAUTHORIZED,
    HttpStatus.FORBIDDEN,
    HttpStatus.NOT_FOUND,
  )
  async deleteSfiaMapping(
    @Param('socCode') socCode: string,
    @Param('mappingId') mappingId: string,
  ): Promise<{ success: boolean; message: string }> {
    return await this.onetAdminService.deleteSfiaMapping(socCode, mappingId);
  }

  /**
   * 12. Khôi phục ánh xạ SFIA mặc định
   */
  @Post('occupations/:socCode/sfia-mappings/reset')
  @ApiOperation({
    summary: 'Reset SFIA mappings to default for an occupation',
  })
  @ApiParam({ name: 'socCode', example: '15-1252.00' })
  @ApiOkResponse({
    description: 'SFIA mappings reset to defaults successfully',
    type: [OnetSfiaMappingItemDto],
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async resetSfiaMappings(
    @Param('socCode') socCode: string,
  ): Promise<OnetSfiaMappingItemDto[]> {
    return await this.onetAdminService.resetSfiaMappings(socCode);
  }

  /**
   * 13. Lấy toàn bộ thư viện kỹ năng SFIA 9 cho Combobox gợi ý
   */
  @Get('sfia-library')
  @ApiOperation({
    summary: 'Get full SFIA 9 skills library for Combobox lookup',
  })
  @ApiOkResponse({
    description: 'List of all SFIA 9 skills with level constraints',
    type: [SfiaLibrarySkillDto],
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)
  async getSfiaLibrary(): Promise<SfiaLibrarySkillDto[]> {
    return await this.onetAdminService.getSfiaLibrary();
  }
}
