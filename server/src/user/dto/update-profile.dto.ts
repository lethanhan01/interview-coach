import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsObject,
  IsArray,
  Min,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  targetPosition?: string;

  @IsString()
  @IsOptional()
  targetRoleCategory?: string;

  @IsString()
  @IsOptional()
  targetLevel?: string;

  @IsString()
  @IsOptional()
  preferredTechStack?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  yearsExperience?: number;

  @IsString()
  @IsOptional()
  defaultLanguage?: string;

  @IsBoolean()
  @IsOptional()
  ttsEnabled?: boolean;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  hometown?: string;

  @IsString()
  @IsOptional()
  nationality?: string;

  @IsString()
  @IsOptional()
  personality?: string;

  @IsObject()
  @IsOptional()
  education?: Record<string, unknown>;

  @IsArray()
  @IsOptional()
  workExperience?: Record<string, unknown>[];

  @IsArray()
  @IsOptional()
  projects?: Record<string, unknown>[];
}
