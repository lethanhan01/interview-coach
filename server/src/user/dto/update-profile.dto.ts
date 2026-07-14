import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

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

  @IsArray()
  @IsOptional()
  technicalSkills?: Record<string, unknown>[];

  @IsArray()
  @IsOptional()
  certifications?: Record<string, unknown>[];

  @IsArray()
  @IsOptional()
  awards?: Record<string, unknown>[];
}
