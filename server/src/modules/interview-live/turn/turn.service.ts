import { Injectable } from '@nestjs/common';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { TurnResponseDto } from './dto/turn-response.dto';
import { SubmitTurnAnswer } from './submit-turn-answer.service';

@Injectable()
export class TurnService {
  constructor(private readonly submitTurnAnswer: SubmitTurnAnswer) {}

  submitAnswer(
    sessionId: string,
    userId: string,
    dto: SubmitAnswerDto,
  ): Promise<TurnResponseDto> {
    return this.submitTurnAnswer.execute(sessionId, userId, dto);
  }
}
