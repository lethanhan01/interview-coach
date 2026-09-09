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
  @Max(1500)
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
// RESPONSE DTOS
// ==========================================

export class OnetAnalyticsSummaryDto {
  @ApiProperty({ example: 1016 }) totalOccupations: number;
  @ApiProperty({ example: 23 }) totalMajorGroups: number;
  @ApiProperty({ example: 45 }) totalMappedOccupations: number;
  @ApiProperty({ example: 4.4 }) overallMappingCoveragePercent: number;
  @ApiProperty({ example: 35 }) itGroupOccupations: number;
  @ApiProperty({ example: 28 }) itGroupMappedOccupations: number;
  @ApiProperty({ example: 80.0 }) itGroupCoveragePercent: number;
  @ApiProperty({ example: 31821 }) totalSoftwareSkills: number;
  @ApiProperty({ example: 450 }) hotTechCount: number;
  @ApiProperty({ example: 1200 }) inDemandTechCount: number;
  @ApiProperty({ example: 54269 }) totalAlternateTitles: number;
  @ApiProperty({ example: 120 }) totalMockInterviews: number;
  @ApiProperty({ example: 85 }) totalLinkedJobDescriptions: number;
}

export class SocGroupDistributionItemDto {
  @ApiProperty({ example: '15' }) code: string;
  @ApiProperty({ example: 'Máy tính & Toán học' }) name: string;
  @ApiProperty({ example: 'Computer and Mathematical Occupations' }) englishName: string;
  @ApiProperty({ example: 35 }) totalOccupations: number;
  @ApiProperty({ example: 28 }) mappedOccupations: number;
  @ApiProperty({ example: 80.0 }) mappingCoveragePercent: number;
  @ApiProperty({ example: true }) isFocusGroup: boolean;
}

export class OnetMajorGroupSummaryDto {
  @ApiProperty({ example: '15' }) code: string;
  @ApiProperty({ example: 'Máy tính & Toán học' }) name: string;
  @ApiProperty({ example: 'Computer and Mathematical Occupations' }) englishName: string;
  @ApiProperty({ example: 35 }) totalOccupations: number;
  @ApiProperty({ example: 28 }) mappedCount: number;
}

export class OnetTopOccupationItemDto {
  @ApiProperty({ example: '15-1252.00' }) socCode: string;
  @ApiProperty({ example: 'Software Developers' }) title: string;
  @ApiProperty({ example: '15' }) majorGroupCode: string;
  @ApiProperty({ example: 'Máy tính & Toán học' }) majorGroupName: string;
  @ApiProperty({ example: 42 }) mockInterviewCount: number;
  @ApiProperty({ example: 15 }) jobDescriptionCount: number;
  @ApiProperty({ example: 8 }) mappingCount: number;
  @ApiProperty({ example: true }) isMapped: boolean;
  @ApiProperty({ example: ['PROG', 'TEST'], type: [String] }) coreSkillCodes: string[];
}

export class SfiaSkillCoverageItemDto {
  @ApiProperty({ example: 'PROG' }) code: string;
  @ApiProperty({ example: 'Programming/software development' }) name: string;
  @ApiProperty({ example: 'Software Engineering' }) category: string;
  @ApiProperty({ example: 18 }) mappedOccupationsCount: number;
  @ApiProperty({ example: 14 }) coreCount: number;
  @ApiProperty({ example: 4 }) secondaryCount: number;
  @ApiProperty({ example: 2 }) minTargetLevel: number;
  @ApiProperty({ example: 6 }) maxTargetLevel: number;
  @ApiProperty({ example: 3.8 }) avgTargetLevel: number;
}

export class OnetOccupationSummaryDto {
  @ApiProperty({ example: '15-1252.00' }) socCode: string;
  @ApiProperty({ example: 'Software Developers' }) title: string;
  @ApiProperty({ example: '15' }) majorGroupCode: string;
  @ApiProperty({ example: true }) isMapped: boolean;
  @ApiProperty({ example: 8 }) mappingCount: number;
}

export class OnetJobZoneInfoDto {
  @ApiProperty({ example: 4 }) zone: number;
  @ApiProperty({ example: 'Considerable Preparation Needed' }) name: string;
  @ApiProperty({ example: "Bachelor's degree" }) education: string;
  @ApiProperty({ example: '2 to 4 years' }) experience: string;
  @ApiProperty({ example: 'Several months to a year' }) jobTraining: string;
}

export class OnetTaskStatementDto {
  @ApiProperty({ example: '1024' }) id: string;
  @ApiProperty({ example: 'Develop, create, and modify general computer applications software.' }) statement: string;
  @ApiProperty({ example: true }) isCore: boolean;
}

export class OnetSoftwareSkillDto {
  @ApiProperty({ example: 'Node.js' }) name: string;
  @ApiProperty({ example: 'Development Environment Software' }) category: string;
  @ApiProperty({ example: true }) isHotTechnology: boolean;
  @ApiProperty({ example: true }) inDemand: boolean;
}

export class OnetSfiaMappingItemDto {
  @ApiProperty({ example: 'map_123' }) id: string;
  @ApiPropertyOptional({ example: '15-1252.00' }) onetSocCode?: string;
  @ApiProperty({ example: 'PROG' }) sfiaSkillCode: string;
  @ApiProperty({ example: 'Programming/software development' }) skillName: string;
  @ApiPropertyOptional({ example: 'Software engineering' }) skillCategory?: string;
  @ApiProperty({ example: 3 }) targetSfiaLevel: number;
  @ApiProperty({ example: 1.5 }) defaultWeight: number;
  @ApiProperty({ example: true }) isCore: boolean;
  @ApiProperty({ example: 'EXPERT_CURATED' }) source: string;
  @ApiProperty({ example: 2 }) minLevel: number;
  @ApiProperty({ example: 6 }) maxLevel: number;
  @ApiPropertyOptional({ example: 'Designs, codes, verifies, tests, amends...' }) responsibility?: string;
  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' }) createdAt?: string;
  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' }) updatedAt?: string;
}

export class OnetSfiaMappingResponseDto extends OnetSfiaMappingItemDto {}

export class SfiaLibrarySkillLevelDto {
  @ApiProperty({ example: 2 }) level: number;
  @ApiProperty({ example: 'Designs, codes, verifies, tests, amends...' }) description: string;
}

export class SfiaLibrarySkillDto {
  @ApiProperty({ example: 'PROG' }) code: string;
  @ApiProperty({ example: 'Programming/software development' }) name: string;
  @ApiProperty({ example: 'Software engineering' }) category: string;
  @ApiProperty({ example: 'SWEN' }) categoryCode: string;
  @ApiProperty({ example: 2 }) minLevel: number;
  @ApiProperty({ example: 6 }) maxLevel: number;
  @ApiProperty({ example: 'The planning, designing, creation, testing...' }) description: string;
  @ApiProperty({ type: [SfiaLibrarySkillLevelDto] }) levels: SfiaLibrarySkillLevelDto[];
}

export class OnetOccupationDetailStatsDto {
  @ApiProperty({ example: 120 }) toolCount: number;
  @ApiProperty({ example: 25 }) taskCount: number;
  @ApiProperty({ example: 8 }) mappingCount: number;
  @ApiProperty({ example: 84 }) alternateTitleCount: number;
}

export class OnetOccupationDetailDto extends OnetOccupationSummaryDto {
  @ApiProperty({ example: 'Research, design, and develop computer and network software.' }) description: string;
  @ApiProperty({ type: OnetJobZoneInfoDto }) jobZone: OnetJobZoneInfoDto;
  @ApiProperty({ type: OnetOccupationDetailStatsDto }) stats: OnetOccupationDetailStatsDto;
  @ApiProperty({ type: [OnetTaskStatementDto] }) tasks: OnetTaskStatementDto[];
  @ApiProperty({ type: [OnetSoftwareSkillDto] }) softwareSkills: OnetSoftwareSkillDto[];
  @ApiProperty({ example: ['Full Stack Developer', 'Backend Engineer'], type: [String] }) alternateTitles: string[];
  @ApiProperty({ type: [OnetSfiaMappingItemDto] }) sfiaMappings: OnetSfiaMappingItemDto[];
}

export class PaginatedAlternateTitlesDto {
  @ApiProperty({ example: ['Full Stack Developer', 'Backend Engineer'], type: [String] }) items: string[];
  @ApiProperty({ example: 84 }) total: number;
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 20 }) limit: number;
  @ApiProperty({ example: 5 }) totalPages: number;
}

