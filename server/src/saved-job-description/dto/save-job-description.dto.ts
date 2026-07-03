import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SaveJobDescriptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  companyName: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  companyWebsite?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  jobTitle: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  level: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  headcount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  location?: string;

  @IsString()
  @MinLength(30)
  requirements: string;

  @IsString()
  @MinLength(30)
  jobContent: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  techStack?: string[];

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  salary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bonus?: string;
}
