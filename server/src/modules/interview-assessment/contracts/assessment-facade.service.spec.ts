import { Test, TestingModule } from '@nestjs/testing';
import { AssessmentFacade } from './assessment-facade.service';
import { RubricCatalogService } from '../evaluation/rubric/rubric-catalog.service';
import { ContextPackService } from '../evaluation/context-pack.service';
import { ReportService } from '../report/report.service';

describe('AssessmentFacade', () => {
  let facade: AssessmentFacade;
  let rubricCatalog: jest.Mocked<RubricCatalogService>;
  let contextPackService: jest.Mocked<ContextPackService>;
  let reportService: jest.Mocked<ReportService>;

  beforeEach(async () => {
    rubricCatalog = {
      ensureActiveRubricVersion: jest.fn(),
    } as unknown as jest.Mocked<RubricCatalogService>;

    contextPackService = {
      getContextPack: jest.fn(),
      getRubricSnapshot: jest.fn(),
    } as unknown as jest.Mocked<ContextPackService>;

    reportService = {
      getFeedbackProgress: jest.fn(),
      enqueueIfAllFeedbacksReady: jest.fn(),
      getReport: jest.fn(),
    } as unknown as jest.Mocked<ReportService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentFacade,
        { provide: RubricCatalogService, useValue: rubricCatalog },
        { provide: ContextPackService, useValue: contextPackService },
        { provide: ReportService, useValue: reportService },
      ],
    }).compile();

    facade = module.get<AssessmentFacade>(AssessmentFacade);
  });

  it('delegates ensureActiveRubricVersion to RubricCatalogService', async () => {
    rubricCatalog.ensureActiveRubricVersion.mockResolvedValue('rubric-v1');

    const result = await facade.ensureActiveRubricVersion('VN');

    expect(rubricCatalog.ensureActiveRubricVersion).toHaveBeenCalledWith('VN');
    expect(result).toBe('rubric-v1');
  });

  it('delegates getContextPack to ContextPackService', async () => {
    const mockConfig = {
      type: 'VN' as const,
      rubricDimensions: ['D1'],
      behavioralDimensions: [],
      technicalDimensions: [],
      culturalNotes: 'Notes',
      scoringWeights: {},
    };
    contextPackService.getContextPack.mockResolvedValue(mockConfig);

    const result = await facade.getContextPack('VN');

    expect(contextPackService.getContextPack).toHaveBeenCalledWith('VN');
    expect(result).toEqual(mockConfig);
  });

  it('delegates getRubricSnapshot to ContextPackService', async () => {
    const mockSnapshot = { categories: [] };
    contextPackService.getRubricSnapshot.mockResolvedValue(mockSnapshot);

    const result = await facade.getRubricSnapshot('VN');

    expect(contextPackService.getRubricSnapshot).toHaveBeenCalledWith('VN');
    expect(result).toEqual(mockSnapshot);
  });

  it('delegates getFeedbackProgress to ReportService', async () => {
    const mockProgress = {
      sessionId: 's-1',
      status: 'in_progress',
      totalQuestions: 5,
      answeredQuestions: 3,
      skippedQuestions: 0,
      feedbackRequired: 3,
      feedbackCompleted: 2,
      feedbackPending: 1,
      reportReady: false,
    };
    reportService.getFeedbackProgress.mockResolvedValue(mockProgress);

    const result = await facade.getFeedbackProgress('s-1', 'u-1');

    expect(reportService.getFeedbackProgress).toHaveBeenCalledWith('s-1', 'u-1');
    expect(result).toEqual(mockProgress);
  });

  it('delegates enqueueIfAllFeedbacksReady to ReportService', async () => {
    reportService.enqueueIfAllFeedbacksReady.mockResolvedValue(undefined);

    await facade.enqueueIfAllFeedbacksReady('s-1', 'technical', 'VN', 'vi');

    expect(reportService.enqueueIfAllFeedbacksReady).toHaveBeenCalledWith(
      's-1',
      'technical',
      'VN',
      'vi',
    );
  });

  it('delegates getReport to ReportService', async () => {
    const mockReport = {
      sessionId: 's-1',
      reportQuality: 'full' as const,
      overallScore: 85,
      executiveSummary: {},
      competencyHeatmap: {},
      actionPlan: {},
      transcript: [],
    };
    reportService.getReport.mockResolvedValue(mockReport);

    const result = await facade.getReport('s-1', 'u-1', true);

    expect(reportService.getReport).toHaveBeenCalledWith('s-1', 'u-1', true);
    expect(result).toEqual(mockReport);
  });
});
