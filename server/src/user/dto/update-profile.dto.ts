import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
export class UpdateProfileDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstname?: string;
  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastname?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() personality?: string;
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
