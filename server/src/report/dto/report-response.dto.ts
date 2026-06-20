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
  questionText: string;
  orderIndex: number;
  answerText: string;
  overallScore: number | null;
  modelAnswer: string;
  keyTakeaway: string;
  isFallback: boolean;
  segments: AnnotatedSegmentDto[];
}

export class ReportResponseDto {
  sessionId: string;
  overallScore: number | null;
  executiveSummary: Record<string, unknown>;
  competencyHeatmap: Record<string, unknown>;
  actionPlan: Record<string, unknown>;
  transcript: TranscriptItemDto[];
}
