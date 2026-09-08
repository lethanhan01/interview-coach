import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCandidateProfileDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  targetPosition?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  targetLevel?: string;

  @ApiPropertyOptional({ maxLength: 10, description: 'O*NET SOC Code' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  onetSocCode?: string;

  @ApiPropertyOptional({
    maxLength: 255,
    description: 'O*NET Occupation Title',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  onetOccupationTitle?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 7,
    description: 'Target SFIA Level',
  })
  @IsInt()
  @Min(1)
  @Max(7)
  @IsOptional()
  targetSfiaLevel?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  personality?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsObject()
  @IsOptional()
  education?: Record<string, unknown>;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  @IsArray()
  @IsOptional()
  workExperience?: Record<string, unknown>[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  @IsArray()
  @IsOptional()
  projects?: Record<string, unknown>[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  @IsArray()
  @IsOptional()
  technicalSkills?: Record<string, unknown>[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  @IsArray()
  @IsOptional()
  certifications?: Record<string, unknown>[];

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  @IsArray()
  @IsOptional()
  awards?: Record<string, unknown>[];
}
