import {
  IsEnum,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MaxLength,
  ValidateIf,
  IsUrl,
} from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  questionId: string;

  @IsEnum(['text', 'voice'])
  answerMode: 'text' | 'voice';

  @ValidateIf((o: SubmitAnswerDto) => o.answerMode === 'text')
  @IsString()
  answerText?: string;

  @ValidateIf((o: SubmitAnswerDto) => o.answerMode === 'voice')
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
    require_valid_protocol: true,
  })
  @MaxLength(2048)
  audioFileUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  audioDurationSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10 * 1024 * 1024)
  audioSizeBytes?: number;
}
