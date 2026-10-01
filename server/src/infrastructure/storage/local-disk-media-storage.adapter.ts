import { Injectable, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import {
  type IPrivateMediaStorage,
  type UploadedMediaFile,
  type StoredMediaResult,
  type SignedUrlResult,
} from './media-storage.interface';

const DEFAULT_SIGNED_URL_TTL_SECONDS = 1800; // 30 minutes

@Injectable()
export class LocalDiskMediaStorageAdapter implements IPrivateMediaStorage {
  private readonly storageBasePath: string;
  private readonly appUrl: string;
  private readonly secret: string;
  private readonly defaultTtlSeconds: number;

  constructor(config: ConfigService) {
    const rawPath =
      config.get<string>('MEDIA_STORAGE_PATH') || './uploads/audio';
    this.storageBasePath = path.resolve(rawPath);
    this.appUrl = (
      config.get<string>('APP_URL') || 'http://localhost:3000'
    ).replace(/\/+$/, '');
    this.secret = config.getOrThrow<string>('AUTH_JWT_SECRET');
    this.defaultTtlSeconds = Number(
      config.get<string>('MEDIA_SIGNED_URL_TTL_SECONDS') ||
        DEFAULT_SIGNED_URL_TTL_SECONDS,
    );
  }

  /**
   * Resolves a media key to an absolute filesystem path safely,
   * strictly preventing path traversal attacks.
   */
  resolveSafePath(mediaKey: string): string {
    if (!mediaKey || typeof mediaKey !== 'string') {
      throw new InterviewAIException(
        ErrorCode.INVALID_AUDIO_URL,
        HttpStatus.BAD_REQUEST,
        'Khóa tệp âm thanh không hợp lệ.',
      );
    }

    if (mediaKey.includes('\0')) {
      throw new InterviewAIException(
        ErrorCode.FORBIDDEN,
        HttpStatus.FORBIDDEN,
        'Đường dẫn chứa ký tự bị cấm.',
      );
    }

    // Normalize slashes for cross-platform compatibility
    const normalizedKey = mediaKey.replace(/\\/g, '/').replace(/^\/+/, '');
    const absolutePath = path.resolve(this.storageBasePath, normalizedKey);

    // Verify that the resolved absolute path starts with storageBasePath
    const baseWithSep = this.storageBasePath.endsWith(path.sep)
      ? this.storageBasePath
      : `${this.storageBasePath}${path.sep}`;

    if (
      absolutePath !== this.storageBasePath &&
      !absolutePath.startsWith(baseWithSep)
    ) {
      throw new InterviewAIException(
        ErrorCode.FORBIDDEN,
        HttpStatus.FORBIDDEN,
        'Truy cập đường dẫn nằm ngoài phạm vi lưu trữ.',
      );
    }

    return absolutePath;
  }

  /**
   * Saves an uploaded media file to the local disk.
   */
  async upload(params: {
    path: string;
    file: UploadedMediaFile;
  }): Promise<StoredMediaResult> {
    const { path: objectPath, file } = params;
    const targetPath = this.resolveSafePath(objectPath);

    await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.promises.writeFile(targetPath, file.buffer);

    const signedResult = await this.createSignedUrl(objectPath);

    return {
      mediaKey: objectPath,
      audioSizeBytes: file.size,
      audioFileUrl: signedResult.signedUrl,
    };
  }

  /**
   * Generates an HMAC-signed URL with an expiration timestamp.
   */
  async createSignedUrl(
    mediaKey: string,
    expiresInSeconds?: number,
  ): Promise<SignedUrlResult> {
    const ttl = expiresInSeconds ?? this.defaultTtlSeconds;
    const expires = Math.floor(Date.now() / 1000) + ttl;
    const token = this.generateHmac(mediaKey, expires);

    const signedUrl = `${this.appUrl}/media/audio/stream?key=${encodeURIComponent(
      mediaKey,
    )}&expires=${expires}&token=${token}`;

    return {
      signedUrl,
      expiresInSeconds: ttl,
    };
  }

  /**
   * Deletes a media file from the local disk.
   */
  async delete(mediaKey: string): Promise<void> {
    const targetPath = this.resolveSafePath(mediaKey);
    try {
      await fs.promises.unlink(targetPath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  /**
   * Reads the full file buffer directly from local disk.
   */
  async readBuffer(mediaKey: string): Promise<Buffer> {
    const targetPath = this.resolveSafePath(mediaKey);
    try {
      return await fs.promises.readFile(targetPath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new InterviewAIException(
          ErrorCode.NOT_FOUND,
          HttpStatus.NOT_FOUND,
          'Không tìm thấy tệp âm thanh trên máy chủ.',
        );
      }
      throw err;
    }
  }

  /**
   * Computes HMAC-SHA256 signature for mediaKey and expiry.
   */
  generateHmac(mediaKey: string, expires: number): string {
    return createHmac('sha256', this.secret)
      .update(`${mediaKey}:${expires}`)
      .digest('hex');
  }

  /**
   * Constant-time verification of HMAC token.
   */
  verifyToken(mediaKey: string, expires: number, token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    const expected = this.generateHmac(mediaKey, expires);
    if (expected.length !== token.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  }
}
