import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { RubricCatalogService } from '../evaluation/rubric/rubric-catalog.service';
import {
  ContextPackService,
  type ContextPackConfig,
  type ContextPackType,
} from '../evaluation/context-pack.service';
import { ReportService } from '../report/report.service';
import type { ContextPackId } from '../evaluation/rubric/context-pack.data';
import type { FeedbackProgressDto } from '../report/dto/feedback-progress.dto';
import type { ReportResponseDto } from '../report/dto/report-response.dto';

@Injectable()
export class AssessmentFacade {
  constructor(
    private readonly rubricCatalog: RubricCatalogService,
    private readonly contextPackService: ContextPackService,
    private readonly reportService: ReportService,
  ) {}

  ensureActiveRubricVersion(contextPack: ContextPackId): Promise<string> {
    return this.rubricCatalog.ensureActiveRubricVersion(contextPack);
  }

  getContextPack(type: ContextPackType): Promise<ContextPackConfig> {
    return this.contextPackService.getContextPack(type);
  }

  getRubricSnapshot(type: ContextPackType): Promise<Prisma.InputJsonObject> {
    return this.contextPackService.getRubricSnapshot(type);
  }

  getFeedbackProgress(
    sessionId: string,
    userId?: string,
  ): Promise<FeedbackProgressDto> {
    return this.reportService.getFeedbackProgress(sessionId, userId);
  }

  enqueueIfAllFeedbacksReady(
    sessionId: string,
    sessionType: string,
    contextPack: 'VN' | 'Western',
    language?: string,
  ): Promise<void> {
    return this.reportService.enqueueIfAllFeedbacksReady(
      sessionId,
      sessionType,
      contextPack,
      language,
    );
  }

  getReport(
    sessionId: string,
    userId: string,
    canAccessHistory = true,
  ): Promise<ReportResponseDto> {
    return this.reportService.getReport(sessionId, userId, canAccessHistory);
  }
}
