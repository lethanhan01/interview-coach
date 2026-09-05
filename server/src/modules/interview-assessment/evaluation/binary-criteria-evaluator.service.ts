import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import {
  AI_GATEWAY_TOKEN,
  type IAIGateway,
} from '@infra/ai/ai-gateway.interface';
import { ZodValidatorService } from '@infra/ai/zod-validator.service';
import { getLanguageInstruction } from '@infra/ai/output-language';
import { sanitizeFeedbackSegments } from './feedback-segment-sanitizer';

export const BINARY_CRITERIA_PROMPT_VERSION = 'binary-criteria-v1.0';

export const BinaryCriteriaOutputSchema = z.object({
  criteria_evaluations: z.array(
    z.object({
      criteria_id: z.string().describe('ID tiêu chí tương ứng (crit_core, crit_seniority, ...)'),
      passed: z.boolean().describe('Đạt (true) hoặc Không đạt (false)'),
      evidence: z.string().describe('Bằng chứng cụ thể trích dẫn từ câu trả lời của ứng viên'),
      deduction_reason: z
        .string()
        .nullable()
        .optional()
        .describe('Lý do trừ điểm hoặc thiếu sót nếu không đạt'),
    }),
  ),
  strengths: z
    .array(z.string())
    .describe('Điểm mạnh cụ thể thể hiện trong câu trả lời'),
  improvements: z
    .array(z.string())
    .describe('Điểm cần cải thiện để đạt mức độ cao hơn'),
  model_answer: z
    .string()
    .describe('Câu trả lời mẫu chuẩn mực theo đúng vai trò và cấp bậc'),
  key_takeaway: z
    .string()
    .describe('Thông điệp cốt lõi hoặc bài học then chốt rút ra sau câu hỏi'),
  annotated_segments: z
    .array(
      z.object({
        segment_text: z.string(),
        start_index: z.number().int(),
        end_index: z.number().int(),
        highlight_level: z.enum([
          'positive',
          'warning',
          'critical_gap',
          'neutral',
        ]),
        annotation: z.string(),
        suggestion: z.string().nullable().optional(),
        improved_version: z.string().nullable().optional(),
      }),
    )
    .default([]),
});

export type BinaryCriteriaOutput = z.infer<typeof BinaryCriteriaOutputSchema>;

export interface BinaryEvaluationCriterion {
  id: string;
  dimension: 'core' | 'seniority';
  statement?: string;
  text?: string;
  weight?: number;
}

export interface BinaryEvaluationInput {
  questionText: string;
  answerText: string;
  rubricCriteria: BinaryEvaluationCriterion[];
  sessionType: 'technical' | 'hr';
  language?: string;
  sfiaSkillCode?: string;
  targetLevel?: number;
}

export interface BinaryCriterionEvaluationResult {
  criteriaId: string;
  passed: boolean;
  evidence: string;
  deductionReason?: string | null;
}

export interface BinaryEvaluationOutput {
  criteriaEvaluations: BinaryCriterionEvaluationResult[];
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
  keyTakeaway: string;
  annotatedSegments: Array<{
    segmentText: string;
    startIndex: number;
    endIndex: number;
    highlightLevel: 'positive' | 'warning' | 'critical_gap' | 'neutral';
    annotation: string;
    suggestion?: string;
    improvedVersion?: string;
  }>;
  isFallback: boolean;
  promptVersion: string;
}

@Injectable()
export class BinaryCriteriaEvaluatorService {
  private readonly logger = new Logger(BinaryCriteriaEvaluatorService.name);

  constructor(
    @Inject(AI_GATEWAY_TOKEN)
    private readonly aiGateway: IAIGateway,
    private readonly zodValidator: ZodValidatorService,
  ) {}

  /**
   * Đánh giá câu trả lời của ứng viên dựa trên bộ tiêu chí nhị phân (rubricCriteria).
   * LLM đóng vai trò giám khảo khách quan kiểm tra từng tiêu chí (Pass/Fail) kèm evidence.
   */
  async evaluate(
    input: BinaryEvaluationInput,
  ): Promise<BinaryEvaluationOutput> {
    const isVietnamese = input.language !== 'en';

    try {
      const criteriaListText = input.rubricCriteria
        .map(
          (c, idx) =>
            `${idx + 1}. [ID: ${c.id}] (Chiều: ${c.dimension}) ${c.statement ?? c.text ?? ''}`,
        )
        .join('\n');

      const systemPrompt = isVietnamese
        ? `Bạn là Giám khảo Phỏng vấn Độc lập cao cấp, công tâm và giàu kinh nghiệm.
Nhiệm vụ của bạn là đánh giá câu trả lời của ứng viên đối chiếu với bộ tiêu chí nhị phân (rubricCriteria) đã được thiết lập trước.

QUY TẮC ĐÁNH GIÁ NGHIÊM NGẶT:
1. Đánh giá nhị phân Đạt (passed: true) hoặc Không đạt (passed: false) cho TỪNG tiêu chí trong danh sách.
2. Với mỗi tiêu chí, bạn PHẢI trích xuất bằng chứng (evidence) trực tiếp từ câu trả lời của ứng viên để chứng minh nhận định của bạn.
3. Nếu không đạt (passed: false), nêu rõ lý do trừ điểm / lỗ hổng kiến thức trong deduction_reason.
4. Nêu các điểm sáng (strengths) và các điểm cần cải thiện (improvements) mang tính xây dựng cao.
5. Cung cấp câu trả lời mẫu (model_answer) xuất sắc và thông điệp then chốt (key_takeaway).
6. Phân tích các phân đoạn trong câu trả lời (annotated_segments) với highlight_level: 'positive', 'warning', 'critical_gap', 'neutral'.
${getLanguageInstruction(input.language)}`
        : `You are a Senior Independent Interview Evaluator.
Your task is to objectively evaluate the candidate's answer against the predefined binary criteria checklist.

STRICT EVALUATION RULES:
1. Evaluate binary Pass (passed: true) or Fail (passed: false) for EACH criterion in the list.
2. For each criterion, you MUST quote direct evidence from candidate's answer justifying your decision.
3. If not passed, clearly explain the gap/deduction in deduction_reason.
4. Highlight concrete strengths and actionable improvements.
5. Provide an exemplary model_answer and key_takeaway.
6. Provide annotated segments from the candidate's answer with appropriate highlight levels.
${getLanguageInstruction(input.language)}`;

      const userPrompt = `CÂU HỎI PHỎNG VẤN:
"""${input.questionText}"""

DANH SÁCH TIÊU CHÍ ĐÁNH GIÁ (RUBRIC CRITERIA):
${criteriaListText}

CÂU TRẢ LỜI CỦA ỨNG VIÊN:
"""${input.answerText}"""

Hãy trả về kết quả dưới định dạng JSON khớp hoàn toàn với cấu trúc sau:
{
  "criteria_evaluations": [
    {
      "criteria_id": "string",
      "passed": boolean,
      "evidence": "string",
      "deduction_reason": "string or null"
    }
  ],
  "strengths": ["string"],
  "improvements": ["string"],
  "model_answer": "string",
  "key_takeaway": "string",
  "annotated_segments": [
    {
      "segment_text": "string",
      "start_index": number,
      "end_index": number,
      "highlight_level": "positive" | "warning" | "critical_gap" | "neutral",
      "annotation": "string",
      "suggestion": "string or null",
      "improved_version": "string or null"
    }
  ]
}`;

      const rawResponse = await this.aiGateway.chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        maxTokens: 3000,
        responseFormat: 'json_object',
        task: 'feedback',
      });

      const parsedJson = JSON.parse(rawResponse);
      const validated: BinaryCriteriaOutput = this.zodValidator.validate(
        BinaryCriteriaOutputSchema,
        parsedJson,
      );

      // Đảm bảo mọi criteria trong input đều có kết quả đánh giá
      const evaluationMap = new Map(
        validated.criteria_evaluations.map((ev) => [ev.criteria_id, ev]),
      );

      const criteriaEvaluations: BinaryCriterionEvaluationResult[] =
        input.rubricCriteria.map((criterion) => {
          const matched = evaluationMap.get(criterion.id);
          if (matched) {
            return {
              criteriaId: criterion.id,
              passed: matched.passed,
              evidence: matched.evidence,
              deductionReason: matched.deduction_reason ?? null,
            };
          }
          return {
            criteriaId: criterion.id,
            passed: false,
            evidence: isVietnamese
              ? 'Ứng viên chưa đề cập hoặc chưa làm rõ tiêu chí này.'
              : 'Candidate did not address this criterion.',
            deductionReason: isVietnamese
              ? 'Thiếu thông tin chứng minh tiêu chí.'
              : 'Missing supporting information for this criterion.',
          };
        });

      const sanitizedSegments = sanitizeFeedbackSegments(
        input.answerText,
        validated.annotated_segments.map((seg) => ({
          segmentText: seg.segment_text,
          startIndex: seg.start_index,
          endIndex: seg.end_index,
          highlightLevel: seg.highlight_level,
          annotation: seg.annotation,
          suggestion: seg.suggestion ?? undefined,
          improvedVersion: seg.improved_version ?? undefined,
        })),
      );

      return {
        criteriaEvaluations,
        strengths: validated.strengths,
        improvements: validated.improvements,
        modelAnswer: validated.model_answer,
        keyTakeaway: validated.key_takeaway,
        annotatedSegments: sanitizedSegments.segments.map((seg) => ({
          segmentText: seg.segmentText,
          startIndex: seg.startIndex,
          endIndex: seg.endIndex,
          highlightLevel: seg.highlightLevel,
          annotation: seg.annotation,
          suggestion: seg.suggestion ?? undefined,
          improvedVersion: seg.improvedVersion ?? undefined,
        })),
        isFallback: false,
        promptVersion: BINARY_CRITERIA_PROMPT_VERSION,
      };
    } catch (error: unknown) {
      this.logger.warn(
        `BinaryCriteriaEvaluatorService AI evaluation failed, activating resilience fallback: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return this.buildFallbackOutput(input, isVietnamese);
    }
  }

  /**
   * Tạo kết quả fallback dự phòng an toàn khi AI Gateway bị lỗi/quota/mất mạng.
   */
  private buildFallbackOutput(
    input: BinaryEvaluationInput,
    isVietnamese: boolean,
  ): BinaryEvaluationOutput {
    const defaultEvidence = isVietnamese
      ? 'Hệ thống ghi nhận câu trả lời và sử dụng đánh giá an toàn do gián đoạn AI.'
      : 'System recorded answer with safe fallback evaluation due to AI disruption.';

    const criteriaEvaluations: BinaryCriterionEvaluationResult[] =
      input.rubricCriteria.map((c) => ({
        criteriaId: c.id,
        passed: (input.answerText || '').trim().length > 50,
        evidence: defaultEvidence,
        deductionReason: null,
      }));

    return {
      criteriaEvaluations,
      strengths: isVietnamese
        ? ['Ứng viên đã nỗ lực hoàn thành câu trả lời.']
        : ['Candidate attempted to answer the question.'],
      improvements: isVietnamese
        ? ['Cần đào sâu hơn vào các khía cạnh kỹ thuật và phân tích trade-off.']
        : ['Focus more on technical depth and trade-off analysis.'],
      modelAnswer: isVietnamese
        ? 'Hệ thống đang đồng bộ câu trả lời mẫu cho kỹ năng này.'
        : 'Model answer is being synchronized for this skill.',
      keyTakeaway: isVietnamese
        ? 'Hãy luôn cấu trúc câu trả lời mạch lạc theo luận điểm và dẫn chứng.'
        : 'Always structure your answer clearly with arguments and evidence.',
      annotatedSegments: [],
      isFallback: true,
      promptVersion: BINARY_CRITERIA_PROMPT_VERSION,
    };
  }
}
