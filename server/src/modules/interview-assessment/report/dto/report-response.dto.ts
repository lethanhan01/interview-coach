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

export class BinaryCriterionResultDto {
  @ApiProperty() criteriaId: string;
  @ApiProperty() passed: boolean;
  @ApiProperty() evidence: string;
  @ApiPropertyOptional({ nullable: true }) deductionReason?: string | null;
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
  @ApiPropertyOptional({ type: [BinaryCriterionResultDto] })
  criteriaEvaluations?: BinaryCriterionResultDto[];
  @ApiPropertyOptional({ nullable: true })
  demonstratedLevel?: number | null;
  @ApiPropertyOptional({ nullable: true })
  criteriaPassRate?: number | null;
  @ApiPropertyOptional({ type: [String] })
  strengths?: string[];
  @ApiPropertyOptional({ type: [String] })
  improvements?: string[];
}

export class SkillBreakdownDto {
  @ApiProperty({ description: 'Mã kỹ năng SFIA (e.g. PROG, DBDS)' })
  skillCode: string;

  @ApiProperty({ description: 'Tên hiển thị chuẩn của kỹ năng' })
  skillName: string;

  @ApiProperty({ type: [String], description: 'Công nghệ O*NET áp dụng' })
  techContext: string[];

  @ApiProperty({ description: 'Cấp độ SFIA kỳ vọng (1-7)' })
  targetLevel: number;

  @ApiProperty({ description: 'Cấp độ SFIA thực tế thể hiện (1-7)' })
  demonstratedLevel: number;

  @ApiProperty({ description: 'Điểm số kỹ năng (0-100)' })
  score: number;

  @ApiProperty({ enum: ['passed', 'gap'], description: 'Trạng thái đạt chuẩn' })
  status: 'passed' | 'gap';

  @ApiProperty({ description: 'Điểm mạnh chính của ứng viên' })
  strengths: string;

  @ApiProperty({ description: 'Điểm cần cải thiện để đạt chuẩn' })
  areasForImprovement: string;
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
  @ApiPropertyOptional()
  recommendationStatus?: string;
  @ApiPropertyOptional({ type: [SkillBreakdownDto] })
  skillsBreakdown?: SkillBreakdownDto[];
}
