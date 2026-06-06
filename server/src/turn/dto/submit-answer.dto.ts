import {
  IsEnum,
  IsString,
  IsOptional,
  IsInt,
  Min,
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
  @IsUrl()
  audioFileUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  audioDurationSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  audioSizeBytes?: number;
}
