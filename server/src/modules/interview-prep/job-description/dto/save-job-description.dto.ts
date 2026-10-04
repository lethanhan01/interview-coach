import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class SaveJobDescriptionDto {
  @ApiProperty({ minLength: 1, maxLength: 160 })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  companyName: string;
  @ApiPropertyOptional({ maxLength: 300, format: 'uri' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  companyWebsite?: string;
  @ApiProperty({ minLength: 1, maxLength: 160 })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  jobTitle: string;
  @ApiProperty({ minLength: 1, maxLength: 40 })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  level: string;
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  headcount?: string;
  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  location?: string;
  @ApiProperty({ minLength: 30 })
  @IsString()
  @MinLength(30)
  requirements: string;
  @ApiProperty({ minLength: 30 }) @IsString() @MinLength(30) jobContent: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  techStack?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() benefits?: string;
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  salary?: string;
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  bonus?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 7, example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  targetSfiaLevel?: number;
  @ApiPropertyOptional({ example: '15-1252.00' })
  @IsOptional()
  @IsString()
  onetSocCode?: string;
  @ApiPropertyOptional({ example: 'Software Developers' })
  @IsOptional()
  @IsString()
  onetOccupationTitle?: string;
}
