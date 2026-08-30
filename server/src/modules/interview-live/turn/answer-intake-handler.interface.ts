import type { SessionType } from '@core/common/constants/session.constants';
import type { SessionQuestionWithCriteria } from '@modules/interview-prep/question-criteria/question-criteria.service';
import type { SubmitAnswerDto } from './dto/submit-answer.dto';
import type { TurnResponseDto } from './dto/turn-response.dto';

export type AnswerSession = {
  contextPackId: string;
  language: string;
};

export interface AnswerIntakeContext {
  sessionId: string;
  userId: string;
  session: AnswerSession;
  question: SessionQuestionWithCriteria;
  sessionType: SessionType;
}

export interface IAnswerIntakeHandler {
  readonly supportedMode: string;

  handle(
    dto: SubmitAnswerDto,
    context: AnswerIntakeContext,
  ): Promise<TurnResponseDto>;
}
