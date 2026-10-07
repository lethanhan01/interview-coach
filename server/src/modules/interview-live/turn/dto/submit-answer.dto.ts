import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  questionId: string;

  @ApiProperty({ enum: ['text', 'voice'] })
  @IsEnum(['text', 'voice'])
  answerMode: 'text' | 'voice';

  @ApiPropertyOptional({ minLength: 10 })
  @ValidateIf((o: SubmitAnswerDto) => !o.skipQuestion)
  @IsString()
  @MinLength(10)
  answerText?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  skipQuestion?: boolean;

  @ApiPropertyOptional({
    minimum: 0,
    description: 'Speaking duration in seconds for voice mode answers',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  audioDurationSeconds?: number;

  @ApiPropertyOptional({
    description: 'Speech metrics extracted during STT (WPM, pauses, fillers)',
  })
  @IsOptional()
  voiceMetrics?: Record<string, any>;
}
