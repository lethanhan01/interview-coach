import { Injectable } from '@nestjs/common';
import type { UploadedAudioFile } from '../interview/audio-object-storage.service';
import { UploadAndTranscribeAnswerAudio, type AudioUploadResult } from '../interview/upload-and-transcribe-answer-audio.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { TurnResponseDto } from './dto/turn-response.dto';
import { SubmitTurnAnswer } from './submit-turn-answer.service';
import { TurnAnswerContext } from './turn-answer-context.service';

@Injectable()
export class TurnService {
  constructor(
    private readonly context: TurnAnswerContext,
    private readonly uploadAndTranscribeAudio: UploadAndTranscribeAnswerAudio,
    private readonly submitTurnAnswer: SubmitTurnAnswer,
  ) {}

  async uploadAudio(sessionId: string, userId: string, file?: UploadedAudioFile): Promise<AudioUploadResult> {
    await this.context.assertOwner(sessionId, userId);
    return this.uploadAndTranscribeAudio.execute({ sessionId, userId, file });
  }

  submitAnswer(sessionId: string, userId: string, dto: SubmitAnswerDto): Promise<TurnResponseDto> {
    return this.submitTurnAnswer.execute(sessionId, userId, dto);
  }
}
