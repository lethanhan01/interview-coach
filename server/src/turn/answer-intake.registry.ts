import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { IAnswerIntakeHandler } from './answer-intake-handler.interface';
import { TextAnswerIntakeHandler } from './text-answer-intake.handler';
import { VoiceAnswerIntakeHandler } from './voice-answer-intake.handler';

@Injectable()
export class AnswerIntakeRegistry {
  private readonly handlers = new Map<string, IAnswerIntakeHandler>();

  constructor(
    textHandler: TextAnswerIntakeHandler,
    voiceHandler: VoiceAnswerIntakeHandler,
  ) {
    this.register('text', textHandler);
    this.register('voice', voiceHandler);
  }

  public register(mode: string, handler: IAnswerIntakeHandler): void {
    this.handlers.set(mode, handler);
  }

  public getHandler(mode: string): IAnswerIntakeHandler {
    const handler = this.handlers.get(mode);
    if (!handler) {
      throw new InterviewAIException(
        ErrorCode.BAD_REQUEST,
        HttpStatus.BAD_REQUEST,
        `Hình thức trả lời không được hỗ trợ: ${mode}`,
      );
    }
    return handler;
  }
}
