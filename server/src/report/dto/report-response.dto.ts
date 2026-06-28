export class AnnotatedSegmentDto {
  id: string;
  segmentText: string;
  startIndex: number;
  endIndex: number;
  highlightLevel: string;
  annotation: string;
  suggestion?: string;
}

export class TranscriptItemDto {
  answerId?: string;
  questionText: string;
  orderIndex: number;
  answerText: string;
  skipped: boolean;
  overallScore: number | null;
  modelAnswer: string;
  keyTakeaway: string;
  isFallback: boolean;
  segments: AnnotatedSegmentDto[];
}

export class ReportResponseDto {
  sessionId: string;
  reportQuality: 'full' | 'partial' | 'unavailable' | 'not_scorable';
  overallScore: number | null;
  executiveSummary: Record<string, unknown>;
  competencyHeatmap: Record<string, unknown>;
  actionPlan: Record<string, unknown>;
  transcript: TranscriptItemDto[];
}
