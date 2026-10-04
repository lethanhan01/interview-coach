import { Injectable } from '@nestjs/common';
import {
  AudioObjectStorage,
  type StoredAudioFile,
  type UploadedAudioFile,
} from './audio-object-storage.service';
import { SpeechToText } from './speech-to-text.service';

export interface AudioUploadResult extends StoredAudioFile {
  transcript: string;
  transcriptDurationSeconds: number;
}

@Injectable()
export class UploadAndTranscribeAnswerAudio {
  constructor(
    private readonly storage: AudioObjectStorage,
    private readonly speechToText: SpeechToText,
  ) {}

  async execute(params: {
    sessionId: string;
    userId: string;
    file?: UploadedAudioFile;
  }): Promise<AudioUploadResult> {
    const stored = await this.storage.uploadInterviewAudio(params);
    const transcription = await this.speechToText.transcribe(
      stored.audioFileUrl,
    );
    return {
      ...stored,
      transcript: transcription.text,
      transcriptDurationSeconds: transcription.durationSeconds,
    };
  }
}
