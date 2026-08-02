import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({
    minLength: 100,
    example:
      'We are seeking a software engineer with strong TypeScript experience...',
  })
  @IsString()
  @MinLength(100)
  jobDescription: string;
  @ApiProperty({ enum: ['hr', 'technical', 'mixed'] })
  @IsEnum(['hr', 'technical', 'mixed'])
  sessionType: 'hr' | 'technical' | 'mixed';
  @ApiProperty({ enum: ['VN', 'Western'] })
  @IsEnum(['VN', 'Western'])
  contextPack: 'VN' | 'Western';
  @ApiPropertyOptional({ enum: ['vi', 'en'] })
  @IsOptional()
  @IsEnum(['vi', 'en'])
  language?: 'vi' | 'en';
  @ApiPropertyOptional({ minimum: 3, maximum: 45, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(45)
  numQuestions?: number;
  @ApiPropertyOptional({ type: [String], example: ['Frontend Developer'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRoles?: string[];
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  savedJobDescriptionId?: string;
}
