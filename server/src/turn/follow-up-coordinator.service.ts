import { Injectable } from '@nestjs/common';

const MIN_ANSWER_LENGTH = 50;

@Injectable()
export class FollowUpCoordinatorService {
  shouldGenerateFollowUp(
    text: string,
    orderIndex: number,
    totalQuestions: number,
  ): boolean {
    if (orderIndex >= totalQuestions) return false;
    if (text.length < MIN_ANSWER_LENGTH) return false;
    return true;
  }
}
