import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import {
  MEDIA_STORAGE_TOKEN,
  type IPrivateMediaStorage,
  type UploadedMediaFile,
  type StoredMediaResult,
  type SignedUrlResult,
} from './media-storage.interface';

const SUPPORTED_AUDIO_TYPES = new Map([
  ['audio/webm', 'webm'],
  ['audio/mp4', 'mp4'],
  ['audio/wav', 'wav'],
]);

export interface UploadedAudioFile extends UploadedMediaFile {}

export interface StoredAudioFile extends StoredMediaResult {}

@Injectable()
export class AudioObjectStorage {
  constructor(
    @Inject(MEDIA_STORAGE_TOKEN)
    private readonly mediaStorage: IPrivateMediaStorage,
  ) {}

  async uploadInterviewAudio(params: {
    sessionId: string;
    userId: string;
    file?: UploadedAudioFile;
  }): Promise<StoredAudioFile> {
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

    const objectPath = `${userId}/${sessionId}/audio-${randomUUID()}.${extension}`;
    const result = await this.mediaStorage.upload({
      path: objectPath,
      file,
    });

    return result;
  }

  async getSignedUrl(
    mediaKey: string,
    expiresInSeconds?: number,
  ): Promise<SignedUrlResult> {
    return this.mediaStorage.createSignedUrl(mediaKey, expiresInSeconds);
  }
}

