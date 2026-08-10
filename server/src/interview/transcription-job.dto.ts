import type { SessionType } from '../ai/pipelines/interview-pipeline.interface';
import type { OutputLanguage } from '../ai/output-language';

export interface TranscriptionJobDto {
  sessionId: string;
  answerId: string;
  audioFileUrl: string;
  audioDurationSeconds?: number;
  audioSizeBytes?: number;
  contextPack: 'VN' | 'Western';
  sessionType: SessionType;
  language?: OutputLanguage;
}
