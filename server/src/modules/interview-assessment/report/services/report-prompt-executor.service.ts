import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AI_GATEWAY_TOKEN,
  type IAIGateway,
} from '@infra/ai/ai-gateway.interface';
import { COMPREHENSIVE_REPORT_PROMPT_CONFIG } from '@infra/ai/prompts/comprehensive-report-v1.0';
import {
  describeAIError,
  isAIFallbackEligible,
  isAIQuotaExceeded,
} from '@infra/ai/ai-error.utils';
import { getLanguageInstruction } from '@infra/ai/output-language';
import { ReportMetricsAggregator } from './report-metrics-aggregator.service';
import type {
  ActionPlanContent,
  ReportFeedbackInput,
  ReportMetadata,
  ReportUserAnswerRecord,
  SkippedModelAnswersContent,
} from '../types/report-generation.types';

@Injectable()
export class ReportPromptExecutor {
  private readonly logger = new Logger(ReportPromptExecutor.name);

  constructor(
    @Inject(AI_GATEWAY_TOKEN)
    private readonly openai: IAIGateway,
    private readonly metricsAggregator: ReportMetricsAggregator,
  ) {}

  getReportMetadata(): ReportMetadata {
    return {
      generatedByModel: this.openai.getChatModel('report'),
      promptVersion: COMPREHENSIVE_REPORT_PROMPT_CONFIG.version,
    };
  }

  async executeSkippedModelAnswers(params: {
    sessionId: string;
    skippedAnswers: ReportUserAnswerRecord[];
    defaultAnswers: SkippedModelAnswersContent;
    language: 'vi' | 'en';
  }): Promise<SkippedModelAnswersContent> {
    const { sessionId, skippedAnswers, defaultAnswers, language } = params;

    if (skippedAnswers.length === 0) {
      return defaultAnswers;
    }

    try {
      const questionList = skippedAnswers
        .map(
          (answer, index) =>
            `${index + 1}. answerId=${answer.id}\nQuestion: ${answer.question.questionText}`,
        )
        .join('\n\n');

      const raw = await this.openai.chatCompletion({
        temperature: COMPREHENSIVE_REPORT_PROMPT_CONFIG.temperature,
        maxTokens: COMPREHENSIVE_REPORT_PROMPT_CONFIG.maxTokens,
        responseFormat: 'json_object',
        task: 'report',
        messages: [
          {
            role: 'system',
            content: [
              'You are an interview coach. Generate one concise but concrete suggested candidate answer for each skipped interview question.',
              getLanguageInstruction(language),
              'Respond with JSON only: { "answers": [{ "answerId": "...", "modelAnswer": "..." }] }',
            ].join(' '),
          },
          {
            role: 'user',
            content: `Skipped questions:\n${questionList}`,
          },
        ],
      });

      const parsed = JSON.parse(raw) as unknown;
      return this.metricsAggregator.normalizeSkippedAnswers(
        parsed,
        defaultAnswers,
      );
    } catch (openaiError: unknown) {
      if (isAIQuotaExceeded(openaiError)) {
        this.logger.warn(
          `Comprehensive report for session ${sessionId} is using fallback skipped-answer suggestions: AI provider quota exhausted`,
        );
      } else if (isAIFallbackEligible(openaiError)) {
        this.logger.warn(
          `Comprehensive report for session ${sessionId} is using fallback skipped-answer suggestions: ${describeAIError(openaiError)}`,
        );
      } else {
        this.logger.error(
          `ComprehensiveReportProcessor: skipped-answer generation failed for session ${sessionId}`,
          openaiError instanceof Error ? openaiError.stack : String(openaiError),
        );
      }
      return defaultAnswers;
    }
  }

  async executeActionPlan(params: {
    sessionId: string;
    evaluatedFeedbacks: ReportFeedbackInput[];
    defaultActionPlan: ActionPlanContent;
    language: 'vi' | 'en';
  }): Promise<ActionPlanContent> {
    const { sessionId, evaluatedFeedbacks, defaultActionPlan, language } =
      params;

    if (evaluatedFeedbacks.length === 0) {
      this.logger.warn(
        `Comprehensive report for session ${sessionId} has no AI-evaluated feedback; skipping the action-plan API call`,
      );
      return defaultActionPlan;
    }

    try {
      const feedbackSummaries = evaluatedFeedbacks.map((f, i) => ({
        answerIndex: i + 1,
        answerId: f.userAnswerId,
        score: f.overallScore,
        keyTakeaway: f.keyTakeaway,
        isFallback: f.isFallback,
      }));

      const raw = await this.openai.chatCompletion({
        temperature: COMPREHENSIVE_REPORT_PROMPT_CONFIG.temperature,
        maxTokens: COMPREHENSIVE_REPORT_PROMPT_CONFIG.maxTokens,
        responseFormat: 'json_object',
        task: 'report',
        messages: [
          {
            role: 'system',
            content: [
              'You are an interview coach. Based on the feedback summaries, generate a concise action plan with 3-5 specific improvement items. Prioritize non-fallback feedback; fallback rows are only context.',
              getLanguageInstruction(language),
              'Respond with JSON only: { "items": ["item1", "item2", ...] }. Do not use markdown.',
            ].join(' '),
          },
          {
            role: 'user',
            content: `Feedback summaries JSON:\n${JSON.stringify(feedbackSummaries)}`,
          },
        ],
      });

      const parsed = JSON.parse(raw) as unknown;
      return this.metricsAggregator.normalizeActionPlan(
        parsed,
        defaultActionPlan,
      );
    } catch (openaiError: unknown) {
      if (isAIQuotaExceeded(openaiError)) {
        this.logger.warn(
          `Comprehensive report for session ${sessionId} is using a fallback action plan: AI provider quota exhausted`,
        );
      } else if (isAIFallbackEligible(openaiError)) {
        this.logger.warn(
          `Comprehensive report for session ${sessionId} is using a fallback action plan: ${describeAIError(openaiError)}`,
        );
      } else {
        this.logger.error(
          `ComprehensiveReportProcessor: AI provider call failed for session ${sessionId}`,
          openaiError instanceof Error ? openaiError.stack : String(openaiError),
        );
      }
      return defaultActionPlan;
    }
  }
}
