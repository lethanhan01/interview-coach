import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ==========================================
// REQUEST DTOS
// ==========================================

export class CreateOnetSfiaMappingDto {
  @ApiProperty({ example: 'PROG', description: 'Mã kỹ năng SFIA 9' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }): string =>
    typeof value === 'string'
      ? value.trim().toUpperCase()
      : typeof value === 'number'
        ? String(value)
        : '',
  )
  sfiaSkillCode: string;

  @ApiProperty({ example: 3, description: 'Cấp độ mục tiêu SFIA (1 - 7)' })
  @IsInt()
  @Min(1)
  @Max(7)
  @Type(() => Number)
  targetSfiaLevel: number;

  @ApiPropertyOptional({
    example: 1.0,
    description: 'Trọng số đánh giá (0.1 - 5.0)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(5.0)
  @Type(() => Number)
  defaultWeight?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Cờ kỹ năng cốt lõi (Core)',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isCore?: boolean;

  @ApiPropertyOptional({
    example: 'EXPERT_CURATED',
    description: 'Nguồn gốc ánh xạ',
  })
  @IsOptional()
  @IsString()
  source?: string;
}

export class UpdateOnetSfiaMappingDto {
  @ApiPropertyOptional({
    example: 4,
    description: 'Cấp độ mục tiêu SFIA mới (1 - 7)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  @Type(() => Number)
  targetSfiaLevel?: number;

  @ApiPropertyOptional({
    example: 1.5,
    description: 'Trọng số đánh giá mới (0.1 - 5.0)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.1)
  @Max(5.0)
  @Type(() => Number)
  defaultWeight?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Cờ kỹ năng cốt lõi',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isCore?: boolean;

  @ApiPropertyOptional({
    example: 'USER_DEFINED',
    description: 'Nguồn gốc ánh xạ',
  })
  @IsOptional()
  @IsString()
  source?: string;
}

export class OnetSearchOccupationsQueryDto {
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm (mã SOC hoặc tên nghề)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo mã nhóm lớn SOC 2 chữ số (ví dụ: "15")',
  })
  @IsOptional()
  @IsString()
  groupCode?: string;

  @ApiPropertyOptional({ description: 'Chỉ lấy nghề đã có mapping SFIA' })
  @IsOptional()
  @IsBoolean()
  @Transform(
    ({ value }: { value: unknown }): boolean =>
      value === 'true' || value === true,
  )
  mappedOnly?: boolean;

  @ApiPropertyOptional({
    example: 50,
    description: 'Số lượng kết quả tối đa',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  limit?: number = 50;
}

export class OnetAlternateTitlesQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Trang hiện tại' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Số lượng trên một trang' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm chức danh' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class OnetTopOccupationsQueryDto {
  @ApiPropertyOptional({ example: 10, description: 'Số lượng top nghề' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: ['interviews', 'jds', 'mappings'],
    description: 'Tiêu chí sắp xếp',
  })
  @IsOptional()
  @IsEnum(['interviews', 'jds', 'mappings'])
  sortBy?: 'interviews' | 'jds' | 'mappings' = 'interviews';

  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm nghề' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class OnetSfiaCoverageQueryDto {
  @ApiPropertyOptional({
    example: 20,
    description: 'Số lượng kỹ năng SFIA tối đa',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Lọc theo danh mục kỹ năng SFIA' })
  @IsOptional()
  @IsString()
  category?: string;
}

// ==========================================
// RESPONSE DTOS & INTERFACES
// ==========================================

export interface OnetAnalyticsSummaryDto {
  totalOccupations: number;
  totalMajorGroups: number;
  totalMappedOccupations: number;
  overallMappingCoveragePercent: number;
  itGroupOccupations: number;
  itGroupMappedOccupations: number;
  itGroupCoveragePercent: number;
  totalSoftwareSkills: number;
  hotTechCount: number;
  inDemandTechCount: number;
  totalAlternateTitles: number;
  totalMockInterviews: number;
  totalLinkedJobDescriptions: number;
}

export interface SocGroupDistributionItemDto {
  code: string;
  name: string;
  englishName: string;
  totalOccupations: number;
  mappedOccupations: number;
  mappingCoveragePercent: number;
  isFocusGroup: boolean;
}

export interface OnetMajorGroupSummaryDto {
  code: string;
  name: string;
  englishName: string;
  totalOccupations: number;
  mappedCount: number;
}

export interface OnetTopOccupationItemDto {
  socCode: string;
  title: string;
  majorGroupCode: string;
  majorGroupName: string;
  mockInterviewCount: number;
  jobDescriptionCount: number;
  mappingCount: number;
  isMapped: boolean;
  coreSkillCodes: string[];
}

export interface SfiaSkillCoverageItemDto {
  code: string;
  name: string;
  category: string;
  mappedOccupationsCount: number;
  coreCount: number;
  secondaryCount: number;
  minTargetLevel: number;
  maxTargetLevel: number;
  avgTargetLevel: number;
}

export interface OnetOccupationSummaryDto {
  socCode: string;
  title: string;
  majorGroupCode: string;
  isMapped: boolean;
  mappingCount: number;
}

export interface OnetJobZoneInfoDto {
  zone: number;
  name: string;
  education: string;
  experience: string;
  jobTraining: string;
}

export interface OnetTaskStatementDto {
  id: string;
  statement: string;
  isCore: boolean;
}

export interface OnetSoftwareSkillDto {
  name: string;
  category: string;
  isHotTechnology: boolean;
  inDemand: boolean;
}

export interface OnetSfiaMappingResponseDto {
  id: string;
  skillCode: string;
  skillName: string;
  category?: string;
  targetLevel: number;
  minLevel: number;
  maxLevel: number;
  weight: number;
  isCore: boolean;
  source: string;
  responsibility?: string;
  createdAt?: string;
}

export interface OnetOccupationDetailDto extends OnetOccupationSummaryDto {
  description: string;
  jobZone: OnetJobZoneInfoDto;
  stats: {
    toolCount: number;
    taskCount: number;
    mappingCount: number;
    alternateTitleCount: number;
  };
  tasks: OnetTaskStatementDto[];
  softwareSkills: OnetSoftwareSkillDto[];
  alternateTitles: string[];
  sfiaMappings: OnetSfiaMappingResponseDto[];
}

export interface PaginatedAlternateTitlesDto {
  items: string[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
