import { Injectable, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { WhisperService } from './whisper.service';

const AUDIO_BUCKET = 'interview-audio';
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const SUPPORTED_AUDIO_TYPES = new Map([
  ['audio/webm', 'webm'],
  ['audio/mp4', 'mp4'],
  ['audio/wav', 'wav'],
]);

export interface UploadedAudioFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface AudioUploadResult {
  audioFileUrl: string;
  audioSizeBytes: number;
  transcript: string;
  transcriptDurationSeconds: number;
}

@Injectable()
export class AudioStorageService {
  private readonly storage: ReturnType<typeof createClient>['storage'];

  constructor(
    config: ConfigService,
    private readonly whisperService: WhisperService,
  ) {
    this.storage = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    ).storage;
  }

  async uploadInterviewAudio(params: {
    sessionId: string;
    userId: string;
    file?: UploadedAudioFile;
  }): Promise<AudioUploadResult> {
    const { sessionId, userId, file } = params;
    if (!file?.buffer) {
      throw new InterviewAIException(
        ErrorCode.INVALID_ANSWER_TYPE,
        HttpStatus.BAD_REQUEST,
        'Không tìm thấy tệp âm thanh.',
      );
    }

    const mimeType = file.mimetype?.split(';')[0].toLowerCase();
    const extension = SUPPORTED_AUDIO_TYPES.get(mimeType);
    if (!extension) {
      throw new InterviewAIException(
        ErrorCode.INVALID_ANSWER_TYPE,
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        'Định dạng tệp âm thanh không được hỗ trợ.',
      );
    }

    if (file.size > MAX_AUDIO_BYTES) {
      throw new InterviewAIException(
        ErrorCode.AUDIO_TOO_LARGE,
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    const objectPath = `${userId}/${sessionId}/audio-${randomUUID()}.${extension}`;
    const { error } = await this.storage.from(AUDIO_BUCKET).upload(
      objectPath,
      file.buffer,
      {
        contentType: mimeType,
        upsert: false,
      },
    );

    if (error) {
      throw new InterviewAIException(
        ErrorCode.SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        `Không thể tải tệp âm thanh lên Supabase Storage: ${error.message}`,
      );
    }

    const { data } = this.storage.from(AUDIO_BUCKET).getPublicUrl(objectPath);
    const transcription = await this.whisperService.transcribe(data.publicUrl);

    return {
      audioFileUrl: data.publicUrl,
      audioSizeBytes: file.size,
      transcript: transcription.text,
      transcriptDurationSeconds: transcription.durationSeconds,
    };
  }
}
