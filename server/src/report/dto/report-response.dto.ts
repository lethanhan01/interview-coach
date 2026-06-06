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
  overallScore: number;
  modelAnswer: string;
  keyTakeaway: string;
  segments: AnnotatedSegmentDto[];
}

export class ReportResponseDto {
  sessionId: string;
  overallScore: number;
  executiveSummary: Record<string, unknown>;
  competencyHeatmap: Record<string, unknown>;
  actionPlan: Record<string, unknown>;
  transcript: TranscriptItemDto[];
}
