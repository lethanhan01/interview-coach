import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import type { WebSocketLikeConstructor } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import {
  type IPrivateMediaStorage,
  type UploadedMediaFile,
  type StoredMediaResult,
  type SignedUrlResult,
} from './media-storage.interface';

const AUDIO_BUCKET = 'interview-audio';
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const DEFAULT_SIGNED_URL_TTL_SECONDS = 1800; // 30 minutes
const SUPABASE_REALTIME_TRANSPORT =
  WebSocket as unknown as WebSocketLikeConstructor;

const SUPPORTED_AUDIO_TYPES = new Map([
  ['audio/webm', 'webm'],
  ['audio/mp4', 'mp4'],
  ['audio/wav', 'wav'],
]);

@Injectable()
export class SupabaseMediaStorageAdapter implements IPrivateMediaStorage {
  private readonly storage: ReturnType<typeof createClient>['storage'];

  constructor(config: ConfigService) {
    this.storage = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        realtime: {
          transport: SUPABASE_REALTIME_TRANSPORT,
        },
      },
    ).storage;
  }

  async upload(params: {
    path: string;
    file: UploadedMediaFile;
  }): Promise<StoredMediaResult> {
    const { path, file } = params;
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

    const { error } = await this.storage
      .from(AUDIO_BUCKET)
      .upload(path, file.buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new InterviewAIException(
        ErrorCode.SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        `Không thể tải tệp âm thanh lên Supabase Storage: ${error.message}`,
      );
    }

    const signedUrlResult = await this.createSignedUrl(
      path,
      DEFAULT_SIGNED_URL_TTL_SECONDS,
    );

    return {
      mediaKey: path,
      audioSizeBytes: file.size,
      audioFileUrl: signedUrlResult.signedUrl,
    };
  }

  async createSignedUrl(
    mediaKey: string,
    expiresInSeconds: number = DEFAULT_SIGNED_URL_TTL_SECONDS,
  ): Promise<SignedUrlResult> {
    const { data, error } = await this.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(mediaKey, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new InterviewAIException(
        ErrorCode.SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        `Không thể tạo Signed URL cho tệp âm thanh: ${error?.message ?? 'Unknown error'}`,
      );
    }

    return {
      signedUrl: data.signedUrl,
      expiresInSeconds,
    };
  }

  async delete(mediaKey: string): Promise<void> {
    const { error } = await this.storage.from(AUDIO_BUCKET).remove([mediaKey]);
    if (error) {
      throw new InterviewAIException(
        ErrorCode.SERVICE_UNAVAILABLE,
        HttpStatus.SERVICE_UNAVAILABLE,
        `Không thể xóa tệp âm thanh khỏi Supabase Storage: ${error.message}`,
      );
    }
  }
}
