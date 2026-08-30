import { Test, TestingModule } from '@nestjs/testing';
import { ReportPromptExecutor } from './report-prompt-executor.service';
import { ReportMetricsAggregator } from './report-metrics-aggregator.service';
import { AI_GATEWAY_TOKEN } from '@infra/ai/ai-gateway.interface';
import { createMockOpenAIGateway } from '@core/test-utils/mock-factories';
import type {
  ReportFeedbackInput,
  ReportUserAnswerRecord,
} from '../types/report-generation.types';

describe('ReportPromptExecutor', () => {
  let promptExecutor: ReportPromptExecutor;
  let mockOpenAI: ReturnType<typeof createMockOpenAIGateway>;
  let metricsAggregator: ReportMetricsAggregator;

  beforeEach(async () => {
    mockOpenAI = createMockOpenAIGateway();
    mockOpenAI.getChatModel.mockReturnValue('gpt-4o-mini');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportPromptExecutor,
        ReportMetricsAggregator,
        { provide: AI_GATEWAY_TOKEN, useValue: mockOpenAI },
      ],
    }).compile();

    promptExecutor = module.get<ReportPromptExecutor>(ReportPromptExecutor);
    metricsAggregator = module.get<ReportMetricsAggregator>(
      ReportMetricsAggregator,
    );
  });

  describe('getReportMetadata', () => {
    it('returns model name and prompt version', () => {
      const meta = promptExecutor.getReportMetadata();
      expect(meta.generatedByModel).toBe('gpt-4o-mini');
      expect(meta.promptVersion).toBeDefined();
    });
  });

  describe('executeSkippedModelAnswers', () => {
    const defaultAnswers = {
      answers: [{ answerId: 'turn-1', modelAnswer: 'Default model answer' }],
    };
    const skippedAnswers: ReportUserAnswerRecord[] = [
      {
        id: 'turn-1',
        skipped: true,
        question: {
          questionText: 'Explain microservices',
          orderIndex: 1,
          criteria: [],
        },
      },
    ];

    it('returns default answers immediately when skippedAnswers is empty', async () => {
      const result = await promptExecutor.executeSkippedModelAnswers({
        sessionId: 'session-1',
        skippedAnswers: [],
        defaultAnswers,
        language: 'vi',
      });

      expect(result).toEqual(defaultAnswers);
      expect(mockOpenAI.chatCompletion).not.toHaveBeenCalled();
    });

    it('calls AI and returns parsed model answers when successful', async () => {
      mockOpenAI.chatCompletion.mockResolvedValue(
        JSON.stringify({
          answers: [{ answerId: 'turn-1', modelAnswer: 'AI suggested answer' }],
        }),
      );

      const result = await promptExecutor.executeSkippedModelAnswers({
        sessionId: 'session-1',
        skippedAnswers,
        defaultAnswers,
        language: 'vi',
      });

      expect(result.answers[0].modelAnswer).toBe('AI suggested answer');
      expect(mockOpenAI.chatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({
          task: 'report',
          responseFormat: 'json_object',
        }),
      );
    });

    it('recovers with fallback answers when AI throws quota exceeded or other error', async () => {
      mockOpenAI.chatCompletion.mockRejectedValue(
        new Error('Rate limit exceeded: 429 quota exhausted'),
      );

      const result = await promptExecutor.executeSkippedModelAnswers({
        sessionId: 'session-1',
        skippedAnswers,
        defaultAnswers,
        language: 'vi',
      });

      expect(result).toEqual(defaultAnswers);
    });
  });

  describe('executeActionPlan', () => {
    const defaultActionPlan = {
      items: ['Default Action 1', 'Default Action 2', 'Default Action 3'],
    };
    const evaluatedFeedbacks: ReportFeedbackInput[] = [
      {
        userAnswerId: 'turn-1',
        overallScore: 80,
        keyTakeaway: 'Good structure',
        isFallback: false,
        dimensionScores: [],
      },
    ];

    it('returns default action plan when evaluatedFeedbacks is empty without calling AI', async () => {
      const result = await promptExecutor.executeActionPlan({
        sessionId: 'session-1',
        evaluatedFeedbacks: [],
        defaultActionPlan,
        language: 'vi',
      });

      expect(result).toEqual(defaultActionPlan);
      expect(mockOpenAI.chatCompletion).not.toHaveBeenCalled();
    });

    it('calls AI and returns normalized action plan items', async () => {
      mockOpenAI.chatCompletion.mockResolvedValue(
        JSON.stringify({
          items: [
            'Practice concise STAR examples',
            'Improve speed',
            'Elaborate impact',
          ],
        }),
      );

      const result = await promptExecutor.executeActionPlan({
        sessionId: 'session-1',
        evaluatedFeedbacks,
        defaultActionPlan,
        language: 'vi',
      });

      expect(result.items).toContain('Practice concise STAR examples');
    });

    it('returns fallback action plan when AI call throws an error', async () => {
      mockOpenAI.chatCompletion.mockRejectedValue(
        new Error('AI Gateway Timeout'),
      );

      const result = await promptExecutor.executeActionPlan({
        sessionId: 'session-1',
        evaluatedFeedbacks,
        defaultActionPlan,
        language: 'vi',
      });

      expect(result).toEqual(defaultActionPlan);
    });
  });
});
