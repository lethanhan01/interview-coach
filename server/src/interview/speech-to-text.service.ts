import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isIP } from 'node:net';
import { AI_GATEWAY_TOKEN, type IAIGateway } from '../ai/ai-gateway.interface';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../common/exceptions/error-code.enum';

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

  constructor(
    @Inject(AI_GATEWAY_TOKEN)
    private readonly openAIGateway: IAIGateway,
    config: ConfigService,
  ) {
    const supabaseHost = new URL(
      config.getOrThrow<string>('SUPABASE_URL'),
    ).hostname.toLowerCase();
    const configuredHosts =
      config
        .get<string>('AUDIO_ALLOWED_HOSTS')
        ?.split(',')
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean) ?? [];

    this.allowedHosts = new Set([supabaseHost, ...configuredHosts]);
  }

  async transcribe(audioFileUrl: string): Promise<TranscribeResult> {
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
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      isIP(hostname) !== 0 ||
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
}
