import { Injectable, HttpStatus } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { LocalDiskMediaStorageAdapter } from '@infra/storage/local-disk-media-storage.adapter';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { StreamAudioQueryDto } from './dto/stream-audio-query.dto';

export interface AudioStreamResult {
  stream: Readable;
  statusCode: number;
  headers: Record<string, string | number>;
}

const MIME_MAP: Record<string, string> = {
  '.webm': 'audio/webm',
  '.mp4': 'audio/mp4',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
};

@Injectable()
export class StreamAudioService {
  constructor(private readonly storageAdapter: LocalDiskMediaStorageAdapter) {}

  async getAudioStream(
    dto: StreamAudioQueryDto,
    rangeHeader?: string,
  ): Promise<AudioStreamResult> {
    const now = Math.floor(Date.now() / 1000);
    if (dto.expires < now) {
      throw new InterviewAIException(
        ErrorCode.TOKEN_EXPIRED,
        HttpStatus.FORBIDDEN,
        'Liên kết phát âm thanh đã hết hạn.',
      );
    }

    const isValid = this.storageAdapter.verifyToken(
      dto.key,
      dto.expires,
      dto.token,
    );
    if (!isValid) {
      throw new InterviewAIException(
        ErrorCode.FORBIDDEN,
        HttpStatus.FORBIDDEN,
        'Chữ ký xác thực liên kết không hợp lệ.',
      );
    }

    const filePath = this.storageAdapter.resolveSafePath(dto.key);
    let stat: fs.Stats;
    try {
      stat = await fs.promises.stat(filePath);
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

    const fileSize = stat.size;
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'audio/webm';

    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (
        isNaN(start) ||
        start >= fileSize ||
        (parts[1] && end >= fileSize) ||
        start > end
      ) {
        throw new InterviewAIException(
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE,
          'Phạm vi yêu cầu không hợp lệ.',
        );
      }

      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });

      return {
        stream,
        statusCode: HttpStatus.PARTIAL_CONTENT,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
          'Cache-Control': 'private, max-age=1800',
        },
      };
    }

    const stream = fs.createReadStream(filePath);
    return {
      stream,
      statusCode: HttpStatus.OK,
      headers: {
        'Accept-Ranges': 'bytes',
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=1800',
      },
    };
  }
}
