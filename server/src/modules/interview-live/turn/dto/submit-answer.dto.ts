import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class SubmitAnswerDto {
  @ApiProperty({ format: 'uuid' }) @IsString() questionId: string;
  @ApiProperty({ enum: ['text', 'voice'] })
  @IsEnum(['text', 'voice'])
  answerMode: 'text' | 'voice';
  @ApiPropertyOptional({ minLength: 10 })
  @ValidateIf(
    (o: SubmitAnswerDto) =>
      !o.skipQuestion &&
      (o.answerMode === 'text' || o.answerText !== undefined),
  )
  @IsString()
  @MinLength(10)
  answerText?: string;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  skipQuestion?: boolean;
  @ApiPropertyOptional({
    format: 'uri',
    description: 'HTTPS URL required for voice answers.',
  })
  @ValidateIf((o: SubmitAnswerDto) => o.answerMode === 'voice')
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
    require_valid_protocol: true,
  })
  @MaxLength(2048)
  audioFileUrl?: string;
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  audioDurationSeconds?: number;
  @ApiPropertyOptional({ minimum: 0, maximum: 10485760 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10 * 1024 * 1024)
  audioSizeBytes?: number;
}
