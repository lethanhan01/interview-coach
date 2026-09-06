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
  @ApiProperty({ enum: ['hr', 'technical'] })
  @IsEnum(['hr', 'technical'])
  sessionType: 'hr' | 'technical';
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
  @ApiPropertyOptional({ minimum: 1, maximum: 7, example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  targetSfiaLevel?: number;
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  savedJobDescriptionId: string;
}
