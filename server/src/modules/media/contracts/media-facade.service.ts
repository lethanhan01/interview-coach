import { Injectable } from '@nestjs/common';
import {
  AudioObjectStorage,
  type StoredAudioFile,
  type UploadedAudioFile,
} from '../audio-object-storage.service';
import {
  UploadAndTranscribeAnswerAudio,
  type AudioUploadResult,
} from '../upload-and-transcribe-answer-audio.service';
import {
  VoiceMetricsService,
  type VoiceMetrics,
} from '../voice-metrics.service';
import type { SignedUrlResult } from '@infra/storage/media-storage.interface';

@Injectable()
export class MediaFacade {
  constructor(
    private readonly audioStorage: AudioObjectStorage,
    private readonly uploadAndTranscribeAudioService: UploadAndTranscribeAnswerAudio,
    private readonly voiceMetricsService: VoiceMetricsService,
  ) {}

  uploadInterviewAudio(params: {
    sessionId: string;
    userId: string;
    file?: UploadedAudioFile;
  }): Promise<StoredAudioFile> {
    return this.audioStorage.uploadInterviewAudio(params);
  }

  uploadAndTranscribeAudio(params: {
    sessionId: string;
    userId: string;
    file?: UploadedAudioFile;
  }): Promise<AudioUploadResult> {
    return this.uploadAndTranscribeAudioService.execute(params);
  }

  calculateVoiceMetrics(text: string, durationSeconds: number): VoiceMetrics {
    return this.voiceMetricsService.calculate(text, durationSeconds);
  }

  getSignedUrl(
    mediaKey: string,
    expiresInSeconds?: number,
  ): Promise<SignedUrlResult> {
    return this.audioStorage.getSignedUrl(mediaKey, expiresInSeconds);
  }
}
