import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnnotatedSegmentDto {
  @ApiProperty() id: string;
  @ApiProperty() segmentText: string;
  @ApiProperty() startIndex: number;
  @ApiProperty() endIndex: number;
  @ApiProperty() highlightLevel: string;
  @ApiProperty() annotation: string;
  @ApiPropertyOptional() suggestion?: string;
}

export class TranscriptItemDto {
  @ApiPropertyOptional() answerId?: string;
  @ApiProperty() questionText: string;
  @ApiProperty() orderIndex: number;
  @ApiProperty() answerText: string;
  @ApiProperty() skipped: boolean;
  @ApiProperty({ nullable: true }) overallScore: number | null;
  @ApiProperty() modelAnswer: string;
  @ApiProperty() keyTakeaway: string;
  @ApiProperty() isFallback: boolean;
  @ApiProperty({ type: [AnnotatedSegmentDto] }) segments: AnnotatedSegmentDto[];
  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  appliedDimensions?: {
    id: string;
    name: string;
    score: number;
    weight: number;
  }[];
}

export class ReportResponseDto {
  @ApiProperty() sessionId: string;
  @ApiProperty({ enum: ['full', 'partial', 'unavailable', 'not_scorable'] })
  reportQuality: 'full' | 'partial' | 'unavailable' | 'not_scorable';
  @ApiProperty({ nullable: true }) overallScore: number | null;
  @ApiProperty({ type: 'object', additionalProperties: true })
  executiveSummary: Record<string, unknown>;
  @ApiProperty({ type: 'object', additionalProperties: true })
  competencyHeatmap: Record<string, unknown>;
  @ApiProperty({ type: 'object', additionalProperties: true })
  actionPlan: Record<string, unknown>;
  @ApiProperty({ type: [TranscriptItemDto] }) transcript: TranscriptItemDto[];
}
