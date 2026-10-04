import { Test, TestingModule } from '@nestjs/testing';
import {
  BinaryCriteriaEvaluatorService,
  BINARY_CRITERIA_PROMPT_VERSION,
} from './binary-criteria-evaluator.service';
import { AI_GATEWAY_TOKEN } from '@infra/ai/ai-gateway.interface';
import { ZodValidatorService } from '@infra/ai/zod-validator.service';

describe('BinaryCriteriaEvaluatorService', () => {
  let service: BinaryCriteriaEvaluatorService;
  let mockAiGateway: { chatCompletion: jest.Mock };

  beforeEach(async () => {
    mockAiGateway = {
      chatCompletion: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BinaryCriteriaEvaluatorService,
        ZodValidatorService,
        {
          provide: AI_GATEWAY_TOKEN,
          useValue: mockAiGateway,
        },
      ],
    }).compile();

    service = module.get<BinaryCriteriaEvaluatorService>(
      BinaryCriteriaEvaluatorService,
    );
  });

  it('nên được khởi tạo thành công', () => {
    expect(service).toBeDefined();
  });

  it('nên đánh giá thành công khi AI trả về JSON hợp lệ với 2 tiêu chí core và seniority', async () => {
    const aiResponse = {
      criteria_evaluations: [
        {
          criteria_id: 'crit_core',
          passed: true,
          evidence:
            'Ứng viên giải thích rõ ràng về B-Tree index và cơ chế quét.',
          deduction_reason: null,
        },
        {
          criteria_id: 'crit_seniority',
          passed: true,
          evidence: 'Ứng viên phân tích chi tiết trade-off về write latency.',
          deduction_reason: null,
        },
      ],
      strengths: ['Nắm chắc cấu trúc dữ liệu B-Tree', 'Hiểu rõ write overhead'],
      improvements: ['Có thể bổ sung thêm ví dụ về Partial Index'],
      model_answer: 'Câu trả lời mẫu chi tiết...',
      key_takeaway: 'Index giúp tăng tốc đọc nhưng làm chậm thao tác ghi.',
      annotated_segments: [
        {
          segment_text: 'B-Tree index',
          start_index: 0,
          end_index: 12,
          highlight_level: 'positive',
          annotation: 'Thuật ngữ chính xác',
        },
      ],
    };

    mockAiGateway.chatCompletion.mockResolvedValue(JSON.stringify(aiResponse));

    const result = await service.evaluate({
      questionText: 'Giải thích cơ chế Index trong CSDL quan hệ?',
      answerText:
        'B-Tree index giúp tìm kiếm nhanh O(log N) nhưng làm tăng chi phí khi INSERT/UPDATE.',
      rubricCriteria: [
        {
          id: 'crit_core',
          dimension: 'core',
          statement: 'Hiểu đúng cơ chế index',
        },
        {
          id: 'crit_seniority',
          dimension: 'seniority',
          statement: 'Phân tích được trade-off',
        },
      ],
      sessionType: 'technical',
      language: 'vi',
      sfiaSkillCode: 'DBDS',
      targetLevel: 4,
    });

    expect(result.isFallback).toBe(false);
    expect(result.promptVersion).toBe(BINARY_CRITERIA_PROMPT_VERSION);
    expect(result.criteriaEvaluations).toHaveLength(2);
    expect(result.criteriaEvaluations[0].passed).toBe(true);
    expect(result.criteriaEvaluations[0].criteriaId).toBe('crit_core');
    expect(result.criteriaEvaluations[1].passed).toBe(true);
    expect(result.criteriaEvaluations[1].criteriaId).toBe('crit_seniority');
    expect(result.strengths).toEqual(aiResponse.strengths);
    expect(result.modelAnswer).toBe(aiResponse.model_answer);
    expect(result.annotatedSegments).toHaveLength(1);
  });

  it('nên tự động gán passed = false cho tiêu chí bị thiếu trong kết quả AI', async () => {
    const incompleteAiResponse = {
      criteria_evaluations: [
        {
          criteria_id: 'crit_core',
          passed: true,
          evidence: 'Giải thích tốt phần core.',
          deduction_reason: null,
        },
        // Thiếu crit_seniority
      ],
      strengths: ['Tốt phần core'],
      improvements: ['Chưa thấy phân tích seniority'],
      model_answer: 'Mẫu...',
      key_takeaway: 'Takeaway...',
      annotated_segments: [],
    };

    mockAiGateway.chatCompletion.mockResolvedValue(
      JSON.stringify(incompleteAiResponse),
    );

    const result = await service.evaluate({
      questionText: 'Câu hỏi test',
      answerText: 'Câu trả lời test ngắn.',
      rubricCriteria: [
        { id: 'crit_core', dimension: 'core', statement: 'Tiêu chí 1' },
        {
          id: 'crit_seniority',
          dimension: 'seniority',
          statement: 'Tiêu chí 2',
        },
      ],
      sessionType: 'technical',
      language: 'vi',
    });

    expect(result.isFallback).toBe(false);
    expect(result.criteriaEvaluations).toHaveLength(2);
    expect(result.criteriaEvaluations[0].criteriaId).toBe('crit_core');
    expect(result.criteriaEvaluations[0].passed).toBe(true);
    expect(result.criteriaEvaluations[1].criteriaId).toBe('crit_seniority');
    expect(result.criteriaEvaluations[1].passed).toBe(false);
  });

  it('nên kích hoạt fallback dự phòng an toàn khi AI Gateway ném exception', async () => {
    mockAiGateway.chatCompletion.mockRejectedValue(
      new Error('Rate limit quota exceeded'),
    );

    const result = await service.evaluate({
      questionText: 'Câu hỏi test',
      answerText:
        'Một câu trả lời dài hơn 50 ký tự để kiểm tra phản hồi fallback dự phòng của hệ thống.',
      rubricCriteria: [
        { id: 'crit_core', dimension: 'core', statement: 'Tiêu chí 1' },
        {
          id: 'crit_seniority',
          dimension: 'seniority',
          statement: 'Tiêu chí 2',
        },
      ],
      sessionType: 'technical',
      language: 'vi',
    });

    expect(result.isFallback).toBe(true);
    expect(result.criteriaEvaluations).toHaveLength(2);
    expect(result.criteriaEvaluations[0].passed).toBe(false);
    expect(result.criteriaEvaluations[1].passed).toBe(false);
    expect(result.modelAnswer).toBeDefined();
    expect(result.keyTakeaway).toBeDefined();
    expect(result.improvements.length).toBeGreaterThan(0);
  });
});
