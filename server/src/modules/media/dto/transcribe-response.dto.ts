import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class VoiceMetricsDto {
  @ApiProperty({ description: 'Words Per Minute trên thời gian nói thực tế' })
  @IsNumber()
  @Min(0)
  wpm: number;

  @ApiProperty({ description: 'Tổng số từ đệm phát hiện' })
  @IsNumber()
  @Min(0)
  fillerWordCount: number;

  @ApiProperty({ description: 'Danh sách từ đệm cụ thể' })
  @IsArray()
  @IsString({ each: true })
  fillerWords: string[];

  @ApiProperty({ description: 'Số lần ngập ngừng > 1.2s' })
  @IsNumber()
  @Min(0)
  pauseCount: number;

  @ApiProperty({ description: 'Tổng thời gian ngập ngừng (giây)' })
  @IsNumber()
  @Min(0)
  totalPauseDurationSeconds: number;

  @ApiProperty({ description: 'Thời gian phát âm thực tế (giây)' })
  @IsNumber()
  @Min(0)
  speechDurationSeconds: number;

  @ApiProperty({ description: 'Độ tin cậy của mô hình STT (0 - 100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  confidenceScore: number;
}

export class STTWordTimestampDto {
  @ApiProperty({ description: 'Từ ngữ' })
  @IsString()
  word: string;

  @ApiProperty({ description: 'Thời điểm bắt đầu (giây)' })
  @IsNumber()
  @Min(0)
  start: number;

  @ApiProperty({ description: 'Thời điểm kết thúc (giây)' })
  @IsNumber()
  @Min(0)
  end: number;

  @ApiProperty({ description: 'Xác suất dự đoán (0.0 - 1.0)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  probability: number;
}

export class TranscribeResponseDto {
  @ApiProperty({ description: 'Văn bản chuyển hóa từ giọng nói' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Ngôn ngữ nhận diện', example: 'vi' })
  @IsString()
  language: string;

  @ApiProperty({ description: 'Tổng thời lượng âm thanh (giây)' })
  @IsNumber()
  @Min(0)
  durationSeconds: number;

  @ApiProperty({ type: VoiceMetricsDto })
  @ValidateNested()
  @Type(() => VoiceMetricsDto)
  metrics: VoiceMetricsDto;

  @ApiPropertyOptional({ type: [STTWordTimestampDto], description: 'Chi tiết timestamp từng từ' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => STTWordTimestampDto)
  words?: STTWordTimestampDto[];
}
