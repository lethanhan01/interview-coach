import { ReportMetricsAggregator } from './report-metrics-aggregator.service';
import type {
  QuestionCriterionWrapper,
  ReportFeedbackInput,
  ReportUserAnswerRecord,
} from '../types/report-generation.types';

describe('ReportMetricsAggregator', () => {
  let aggregator: ReportMetricsAggregator;

  beforeEach(() => {
    aggregator = new ReportMetricsAggregator();
  });

  describe('fallbackSkippedModelAnswer', () => {
    it('returns Vietnamese fallback model answer for vi', () => {
      const result = aggregator.fallbackSkippedModelAnswer(
        'Kể về một dự án khó',
        'vi',
      );
      expect(result).toContain('Kể về một dự án khó');
      expect(result).toContain('Một câu trả lời tốt');
    });

    it('returns English fallback model answer for en', () => {
      const result = aggregator.fallbackSkippedModelAnswer(
        'Tell me about a project',
        'en',
      );
      expect(result).toContain('Tell me about a project');
      expect(result).toContain('A strong answer should');
    });
  });

  describe('skippedKeyTakeaway', () => {
    it('returns correct takeaway for vi and en', () => {
      expect(aggregator.skippedKeyTakeaway('vi')).toContain(
        'Câu hỏi bị bỏ qua',
      );
      expect(aggregator.skippedKeyTakeaway('en')).toContain(
        'This question was skipped',
      );
    });
  });

  describe('buildSkippedDimensionScores', () => {
    it('sorts criteria by rubricCategory categoryKey, displayOrder, and code', () => {
      const criteria: QuestionCriterionWrapper[] = [
        {
          rubricCriterion: {
            code: 'TECH_02',
            name: 'Problem Solving',
            weight: 1.5,
            displayOrder: 2,
            rubricCategory: { categoryKey: 'technical' },
          },
        },
        {
          rubricCriterion: {
            code: 'BEH_01',
            name: 'Teamwork',
            weight: 1.0,
            displayOrder: 1,
            rubricCategory: { categoryKey: 'behavioral' },
          },
        },
        {
          rubricCriterion: {
            code: 'TECH_01',
            name: 'Code Quality',
            weight: 2.0,
            displayOrder: 1,
            rubricCategory: { categoryKey: 'technical' },
          },
        },
      ];

      const result = aggregator.buildSkippedDimensionScores(criteria);

      expect(result).toHaveLength(3);
      // 'behavioral' comes before 'technical'
      expect(result[0].id).toBe('BEH_01');
      expect(result[0].score).toBe(0);
      expect(result[1].id).toBe('TECH_01');
      expect(result[1].score).toBe(0);
      expect(result[2].id).toBe('TECH_02');
      expect(result[2].score).toBe(0);
    });
  });

  describe('buildSyntheticSkippedFeedbacks', () => {
    it('builds 0-score synthetic feedbacks for skipped answers', () => {
      const skippedAnswers: ReportUserAnswerRecord[] = [
        {
          id: 'turn-1',
          skipped: true,
          question: {
            questionText: 'Explain SOLID',
            orderIndex: 1,
            criteria: [
              {
                rubricCriterion: {
                  code: 'SOLID_KNOW',
                  name: 'Knowledge',
                  weight: 1,
                  displayOrder: 1,
                  rubricCategory: { categoryKey: 'technical' },
                },
              },
            ],
          },
        },
      ];

      const result = aggregator.buildSyntheticSkippedFeedbacks(
        skippedAnswers,
        'vi',
      );
      expect(result).toHaveLength(1);
      expect(result[0].userAnswerId).toBe('turn-1');
      expect(result[0].overallScore).toBe(0);
      expect(result[0].isFallback).toBe(false);
      expect(result[0].keyTakeaway).toContain('Câu hỏi bị bỏ qua');
      expect(result[0].dimensionScores).toEqual([
        { id: 'SOLID_KNOW', name: 'Knowledge', score: 0, weight: 1 },
      ]);
    });
  });

  describe('calculateAggregatedScore', () => {
    it('returns null if there are no evaluated feedbacks', () => {
      expect(aggregator.calculateAggregatedScore([])).toBeNull();
    });

    it('returns rounded average score across evaluated feedbacks', () => {
      const feedbacks: ReportFeedbackInput[] = [
        {
          userAnswerId: '1',
          overallScore: 85,
          keyTakeaway: '',
          isFallback: false,
          dimensionScores: [],
        },
        {
          userAnswerId: '2',
          overallScore: 80,
          keyTakeaway: '',
          isFallback: false,
          dimensionScores: [],
        },
      ];
      expect(aggregator.calculateAggregatedScore(feedbacks)).toBe(83); // (85+80)/2 = 82.5 -> 83
    });
  });

  describe('toDimensionScores and buildCompetencyHeatmap', () => {
    it('calculates average score for each dimension excluding fallbacks', () => {
      const feedbacks = [
        {
          isFallback: false,
          dimensionScores: [
            { id: 'COMM', score: 80 },
            { id: 'TECH', score: 90 },
          ],
        },
        {
          isFallback: false,
          dimensionScores: [
            { id: 'COMM', score: 90 },
            { id: 'TECH', score: 85 },
          ],
        },
        {
          isFallback: true,
          dimensionScores: [{ id: 'COMM', score: 0 }],
        },
      ];

      const heatmap = aggregator.buildCompetencyHeatmap(feedbacks);
      expect(heatmap).toEqual({
        COMM: 85, // (80 + 90) / 2
        TECH: 87.5, // (90 + 85) / 2
      });
    });

    it('handles malformed dimensionScores gracefully', () => {
      const feedbacks = [
        { isFallback: false, dimensionScores: null },
        { isFallback: false, dimensionScores: 'invalid' },
        { isFallback: false, dimensionScores: [{ invalid: true }] },
      ];
      expect(aggregator.buildCompetencyHeatmap(feedbacks)).toEqual({});
    });
  });

  describe('buildExecutiveSummary', () => {
    it('builds Vietnamese summary with score', () => {
      const summary = aggregator.buildExecutiveSummary({
        totalTurns: 3,
        evaluatedTurns: 2,
        fallbackTurns: 0,
        skippedTurns: 1,
        aggregatedScore: 85,
        language: 'vi',
      });

      expect(summary.overallScore).toBe(85);
      expect(summary.totalTurns).toBe(3);
      expect(summary.summary).toContain(
        'Phiên phỏng vấn đã hoàn thành với 2 câu trả lời',
      );
      expect(summary.summary).toContain('85/100');
    });

    it('builds English summary with score', () => {
      const summary = aggregator.buildExecutiveSummary({
        totalTurns: 2,
        evaluatedTurns: 2,
        fallbackTurns: 0,
        skippedTurns: 0,
        aggregatedScore: 90,
        language: 'en',
      });

      expect(summary.summary).toContain(
        'Interview completed with 2 evaluated answers',
      );
    });

    it('uses fallback report summary when aggregatedScore is null', () => {
      const summary = aggregator.buildExecutiveSummary({
        totalTurns: 1,
        evaluatedTurns: 0,
        fallbackTurns: 1,
        skippedTurns: 0,
        aggregatedScore: null,
        language: 'vi',
      });

      expect(summary.overallScore).toBeNull();
      expect(summary.summary).toBeDefined();
    });
  });

  describe('buildCommAnalysis', () => {
    it('maps communication analysis metrics accurately', () => {
      const comm = aggregator.buildCommAnalysis({
        feedbackCount: 5,
        evaluatedFeedbackCount: 3,
        fallbackFeedbackCount: 1,
        skippedFeedbackCount: 1,
      });

      expect(comm).toEqual({
        feedbackCount: 5,
        evaluatedFeedbackCount: 3,
        fallbackFeedbackCount: 1,
        skippedFeedbackCount: 1,
      });
    });
  });

  describe('normalizeActionPlan', () => {
    const fallback = { items: ['Fallback 1', 'Fallback 2', 'Fallback 3'] };

    it('returns fallback if raw candidate is not valid', () => {
      expect(aggregator.normalizeActionPlan(null, fallback)).toEqual(fallback);
      expect(aggregator.normalizeActionPlan('invalid', fallback)).toEqual(
        fallback,
      );
    });

    it('extracts array of strings directly and pads up to 5 with fallback', () => {
      const raw = ['Action 1', 'Action 2', 'Action 3'];
      const result = aggregator.normalizeActionPlan(raw, fallback);
      expect(result.items).toEqual([
        'Action 1',
        'Action 2',
        'Action 3',
        'Fallback 1',
        'Fallback 2',
      ]);
    });

    it('extracts from { items: [...] } object and limits to 5 items', () => {
      const raw = {
        items: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6'],
      };
      const result = aggregator.normalizeActionPlan(raw, fallback);
      expect(result.items).toEqual([
        'Item 1',
        'Item 2',
        'Item 3',
        'Item 4',
        'Item 5',
      ]);
    });

    it('extracts from { actionPlan: { items: [...] } } nested object', () => {
      const raw = { actionPlan: { items: ['Plan 1', 'Plan 2', 'Plan 3'] } };
      const result = aggregator.normalizeActionPlan(raw, fallback);
      expect(result.items).toEqual([
        'Plan 1',
        'Plan 2',
        'Plan 3',
        'Fallback 1',
        'Fallback 2',
      ]);
    });

    it('merges with fallback to ensure at least 3 items if fewer than 3 are provided', () => {
      const raw = { items: ['Only 1 item'] };
      const result = aggregator.normalizeActionPlan(raw, fallback);
      expect(result.items).toEqual([
        'Only 1 item',
        'Fallback 1',
        'Fallback 2',
        'Fallback 3',
      ]);
    });
  });

  describe('normalizeSkippedAnswers', () => {
    const fallback = {
      answers: [
        { answerId: 'turn-1', modelAnswer: 'Default model answer 1' },
        { answerId: 'turn-2', modelAnswer: 'Default model answer 2' },
      ],
    };

    it('returns fallback if raw format is invalid', () => {
      expect(aggregator.normalizeSkippedAnswers(null, fallback)).toEqual(
        fallback,
      );
      expect(
        aggregator.normalizeSkippedAnswers({ answers: 'invalid' }, fallback),
      ).toEqual(fallback);
    });

    it('maps valid AI model answers with aliases', () => {
      const raw = {
        answers: [
          { answerId: 'turn-1', modelAnswer: 'AI generated model answer 1' },
          { answer_id: 'turn-2', model_answer: 'AI generated model answer 2' },
        ],
      };

      const result = aggregator.normalizeSkippedAnswers(raw, fallback);
      expect(result.answers).toEqual([
        { answerId: 'turn-1', modelAnswer: 'AI generated model answer 1' },
        { answerId: 'turn-2', modelAnswer: 'AI generated model answer 2' },
      ]);
    });

    it('preserves fallback model answer for missing or unknown answerId', () => {
      const raw = {
        answers: [
          { answerId: 'turn-1', modelAnswer: 'AI generated model answer 1' },
          { answerId: 'unknown-id', modelAnswer: 'Ignored' },
        ],
      };

      const result = aggregator.normalizeSkippedAnswers(raw, fallback);
      expect(result.answers).toEqual([
        { answerId: 'turn-1', modelAnswer: 'AI generated model answer 1' },
        { answerId: 'turn-2', modelAnswer: 'Default model answer 2' },
      ]);
    });
  });
});
