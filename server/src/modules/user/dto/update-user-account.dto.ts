import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserAccountDto {
  @ApiPropertyOptional({ maxLength: 100, description: 'User first name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstname?: string;

  @ApiPropertyOptional({ maxLength: 100, description: 'User last name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastname?: string;
}
