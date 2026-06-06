import { IsString, IsInt, IsBoolean, IsOptional, Min } from 'class-validator';

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
}
