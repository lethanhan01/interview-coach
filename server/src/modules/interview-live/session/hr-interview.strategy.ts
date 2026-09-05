import { Injectable } from '@nestjs/common';
import { InterviewSession } from '@prisma/client';
import { CreateSessionDto } from './dto/create-session.dto';
import { IInterviewModeStrategy } from './interview-mode-strategy.interface';

@Injectable()
export class HrInterviewStrategy implements IInterviewModeStrategy {
  readonly mode = 'hr';

  validateSessionConfig(_dto: CreateSessionDto): void {
    void _dto;
  }

  buildQuestionGenerationPayload(
    session: InterviewSession,
    dto: CreateSessionDto,
    sfiaVersion = '9.0.0',
  ): Record<string, any> {
    return {
      sessionId: session.id,
      sessionType: this.mode,
      jobDescriptionText: dto.jobDescription,
      targetRoles: dto.targetRoles ?? [],
      contextPack: dto.contextPack,
      rubricVersionId: sfiaVersion,
      sfiaVersion,
      language: session.language,
      totalQuestions: session.numQuestions,
      durationMin: session.durationMin,
      onetSocCode: session.onetSocCode,
      targetSfiaLevel: session.targetSfiaLevel,
    };
  }

  isSessionCompletable(
    session: InterviewSession,
    answeredCount: number,
    totalQuestions: number,
  ): boolean {
    return totalQuestions > 0 && answeredCount >= totalQuestions;
  }

  buildReportGenerationPayload(session: InterviewSession): Record<string, any> {
    return {
      sessionId: session.id,
      sessionType: session.sessionType,
      contextPack: session.contextPackId,
      language: session.language,
    };
  }
}
