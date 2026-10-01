import { Injectable, HttpStatus, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isIP } from 'node:net';
import * as path from 'node:path';
import {
  AI_GATEWAY_TOKEN,
  type IAIGateway,
} from '@infra/ai/ai-gateway.interface';
import { LocalDiskMediaStorageAdapter } from '@infra/storage/local-disk-media-storage.adapter';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const AUDIO_DOWNLOAD_TIMEOUT_MS = 15_000;
const ALLOWED_AUDIO_CONTENT_TYPES = new Set([
  'audio/mp4',
  'audio/wav',
  'audio/webm',
]);

interface TranscribeResult {
  text: string;
  durationSeconds: number;
}

@Injectable()
export class SpeechToText {
  private readonly allowedHosts: Set<string>;
  private readonly isDevOrTest: boolean;

  constructor(
    @Inject(AI_GATEWAY_TOKEN)
    private readonly openAIGateway: IAIGateway,
    config: ConfigService,
    @Optional()
    private readonly storageAdapter?: LocalDiskMediaStorageAdapter,
  ) {
    const rawAppUrl = config.get<string>('APP_URL') || 'http://localhost:3000';
    let appHost = 'localhost';
    try {
      appHost = new URL(rawAppUrl).hostname.toLowerCase();
    } catch {
      // Keep default
    }

    const configuredHosts =
      config
        .get<string>('AUDIO_ALLOWED_HOSTS')
        ?.split(',')
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean) ?? [];

    this.allowedHosts = new Set([appHost, 'localhost', '127.0.0.1', ...configuredHosts]);
    this.isDevOrTest = (config.get<string>('NODE_ENV') || 'development') !== 'production';
  }

  async transcribe(audioFileUrl: string): Promise<TranscribeResult> {
    // 1. Kiểm tra nếu là URL nội bộ -> Đọc trực tiếp Buffer từ Local Disk
    const localKey = this.extractLocalMediaKey(audioFileUrl);
    if (localKey && this.storageAdapter) {
      const buffer = await this.storageAdapter.readBuffer(localKey);
      const mimeType = this.mimeFromKey(localKey);
      return this.openAIGateway.transcribe({
        audioBuffer: buffer,
        mimeType,
        timeoutMs: AUDIO_DOWNLOAD_TIMEOUT_MS,
      });
    }

    // 2. Fallback: Tải qua HTTP nếu là liên kết ngoài
    const url = this.validateAudioUrl(audioFileUrl);
    let response: Response;

    try {
      response = await fetch(url, {
        redirect: 'error',
        signal: AbortSignal.timeout(AUDIO_DOWNLOAD_TIMEOUT_MS),
      });
    } catch {
      throw new InterviewAIException(
        ErrorCode.AUDIO_DOWNLOAD_FAILED,
        HttpStatus.BAD_GATEWAY,
        'Không thể tải tệp âm thanh.',
      );
    }

    if (!response.ok) {
      throw new InterviewAIException(
        ErrorCode.AUDIO_DOWNLOAD_FAILED,
        HttpStatus.BAD_GATEWAY,
        `Tải tệp âm thanh thất bại với HTTP ${response.status}.`,
      );
    }

    const contentType = response.headers.get('content-type')?.split(';')[0];
    if (!contentType || !ALLOWED_AUDIO_CONTENT_TYPES.has(contentType)) {
      throw new InterviewAIException(
        ErrorCode.INVALID_ANSWER_TYPE,
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        'Định dạng tệp âm thanh không được hỗ trợ.',
      );
    }

    const contentLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_AUDIO_BYTES) {
      throw new InterviewAIException(
        ErrorCode.AUDIO_TOO_LARGE,
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    if (!response.body) {
      throw new InterviewAIException(
        ErrorCode.AUDIO_DOWNLOAD_FAILED,
        HttpStatus.BAD_GATEWAY,
        'Phản hồi âm thanh không có dữ liệu.',
      );
    }

    const reader = response.body.getReader();
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > MAX_AUDIO_BYTES) {
        await reader.cancel();
        throw new InterviewAIException(
          ErrorCode.AUDIO_TOO_LARGE,
          HttpStatus.PAYLOAD_TOO_LARGE,
        );
      }
      chunks.push(Buffer.from(value));
    }

    const buffer = Buffer.concat(chunks, totalBytes);
    return this.openAIGateway.transcribe({
      audioBuffer: buffer,
      mimeType: this.toSupportedMimeType(contentType),
      timeoutMs: AUDIO_DOWNLOAD_TIMEOUT_MS,
    });
  }

  private extractLocalMediaKey(audioFileUrl: string): string | null {
    if (!audioFileUrl) return null;
    try {
      const parsed = new URL(audioFileUrl);
      if (parsed.pathname === '/media/audio/stream') {
        return parsed.searchParams.get('key');
      }
    } catch {
      // If it's a relative path or direct mediaKey without protocol
      if (!audioFileUrl.includes('://')) {
        return audioFileUrl;
      }
    }
    return null;
  }

  private validateAudioUrl(audioFileUrl: string): URL {
    let url: URL;
    try {
      url = new URL(audioFileUrl);
    } catch {
      throw new InterviewAIException(
        ErrorCode.INVALID_AUDIO_URL,
        HttpStatus.BAD_REQUEST,
        'URL tệp âm thanh không hợp lệ.',
      );
    }

    const hostname = url.hostname.toLowerCase();
    const isAllowedProtocol =
      url.protocol === 'https:' ||
      (url.protocol === 'http:' && (this.isDevOrTest || hostname === 'localhost' || hostname === '127.0.0.1'));

    if (
      !isAllowedProtocol ||
      url.username ||
      url.password ||
      !this.allowedHosts.has(hostname)
    ) {
      throw new InterviewAIException(
        ErrorCode.INVALID_AUDIO_URL,
        HttpStatus.BAD_REQUEST,
        'Nguồn tệp âm thanh không được phép.',
      );
    }

    return url;
  }

  private toSupportedMimeType(
    contentType: string,
  ): 'audio/webm' | 'audio/mp4' | 'audio/wav' {
    if (contentType === 'audio/mp4') return 'audio/mp4';
    if (contentType === 'audio/wav') return 'audio/wav';
    return 'audio/webm';
  }

  private mimeFromKey(key: string): 'audio/webm' | 'audio/mp4' | 'audio/wav' {
    const ext = path.extname(key).toLowerCase();
    if (ext === '.mp4' || ext === '.m4a') return 'audio/mp4';
    if (ext === '.wav') return 'audio/wav';
    return 'audio/webm';
  }
}
