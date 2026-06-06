import { Injectable, HttpStatus } from '@nestjs/common';
import { OpenAIGateway } from '../ai/openai.gateway';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../common/exceptions/error-code.enum';

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

interface TranscribeResult {
  text: string;
  durationSeconds: number;
}

@Injectable()
export class WhisperService {
  constructor(private readonly openAIGateway: OpenAIGateway) {}

  async transcribe(audioFileUrl: string): Promise<TranscribeResult> {
    const response = await fetch(audioFileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.byteLength > MAX_AUDIO_BYTES) {
      throw new InterviewAIException(
        ErrorCode.AUDIO_TOO_LARGE,
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    return this.openAIGateway.transcribe({
      audioBuffer: buffer,
      mimeType: 'audio/webm',
    });
  }
}
