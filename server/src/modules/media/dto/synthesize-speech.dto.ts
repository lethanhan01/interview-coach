import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SynthesizeSpeechDto {
  @ApiProperty({
    description: 'Text to synthesize into speech',
    maxLength: 1000,
    example: 'Can you tell me about a time you resolved a conflict?',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text: string;

  @ApiPropertyOptional({
    enum: ['vi', 'en'],
    description: 'Voice language code',
  })
  @IsOptional()
  @IsEnum(['vi', 'en'])
  language?: 'vi' | 'en';
}
