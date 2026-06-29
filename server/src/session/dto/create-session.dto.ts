import {
  IsEnum,
  IsString,
  MinLength,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @MinLength(100)
  jobDescription: string;

  @IsEnum(['hr', 'technical', 'mixed'])
  sessionType: 'hr' | 'technical' | 'mixed';

  @IsEnum(['VN', 'Western'])
  contextPack: 'VN' | 'Western';

  @IsOptional()
  @IsEnum(['vi', 'en'])
  language?: 'vi' | 'en';

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(45)
  numQuestions?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRoles?: string[];

  @IsOptional()
  @IsUUID()
  savedJobDescriptionId?: string;
}
