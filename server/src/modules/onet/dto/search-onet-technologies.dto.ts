import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchOnetTechnologiesDto {
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm công nghệ hoặc công cụ phần mềm O*NET',
    example: 'TypeScript',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  query?: string;

  @ApiPropertyOptional({
    description: 'Số lượng kết quả tối đa',
    default: 30,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 30;
}
