import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TranscribeAudioDto {
  @ApiPropertyOptional({ enum: ['vi', 'en'], description: 'Audio language code' })
  @IsOptional()
  @IsEnum(['vi', 'en'])
  language?: 'vi' | 'en';
}
