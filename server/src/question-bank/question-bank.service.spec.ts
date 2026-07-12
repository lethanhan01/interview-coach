import { QuestionBankService } from './question-bank.service';
import { QuestionCriteriaService } from '../question-criteria/question-criteria.service';
import {
  createMockPrismaService,
  createMockQuestionBank,
} from '../test-utils/mock-factories';

describe('QuestionBankService', () => {
  let service: QuestionBankService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    mockPrisma = createMockPrismaService();
    service = new QuestionBankService(
      mockPrisma as any,
      new QuestionCriteriaService(mockPrisma as any),
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('chọn fallback questions theo spread độ khó và resolve text theo language', async () => {
    mockPrisma.questionBank.findMany.mockResolvedValue([
      {
        id: 'easy-1',
        content: 'English fallback',
        difficulty: 2,
        contextPackId: 'VN',
        competencyDomains: ['D4'],
        estimatedTimeMin: 3,
        translations: { en: 'English fallback', vi: 'Câu hỏi tiếng Việt' },
      },
      {
        id: 'medium-1',
        content: 'Medium fallback',
        difficulty: 3,
        contextPackId: 'VN',
        competencyDomains: ['TD4'],
        estimatedTimeMin: 5,
        translations: { en: 'Medium fallback', vi: 'Câu kỹ thuật' },
      },
      {
        id: 'hard-1',
        content: 'Hard fallback',
        difficulty: 4,
        contextPackId: 'VN',
        competencyDomains: ['TD5'],
        estimatedTimeMin: 7,
        translations: { en: 'Hard fallback', vi: 'Câu khó' },
      },
    ]);

    const result = await service.selectFallbackQuestions(
      'technical',
      'VN',
      3,
      'vi',
    );

    expect(mockPrisma.questionBank.findMany).toHaveBeenCalledWith({
      where: { sessionType: 'technical', contextPackId: 'VN', deletedAt: null },
      orderBy: [{ difficulty: 'asc' }, { createdAt: 'asc' }],
      take: 9,
      include: expect.any(Object),
    });
    expect(result).toEqual([
      expect.objectContaining({
        questionBankId: 'easy-1',
        text: 'Câu hỏi tiếng Việt',
        questionCategory: 'behavioral',
      }),
      expect.objectContaining({
        questionBankId: 'medium-1',
        text: 'Câu kỹ thuật',
        questionCategory: 'technical',
      }),
      expect.objectContaining({
        questionBankId: 'hard-1',
        text: 'Câu khó',
        questionCategory: 'technical',
      }),
    ]);
  });

  it('fallback về content khi translation không có language tương ứng', async () => {
    mockPrisma.questionBank.findMany.mockResolvedValue([
      {
        id: 'qb-1',
        content: 'Stored content',
        difficulty: 2,
        contextPackId: 'VN',
        competencyDomains: ['D4'],
        estimatedTimeMin: null,
        translations: { en: 'Stored content' },
      },
    ]);

    const result = await service.selectFallbackQuestions('hr', 'VN', 1, 'vi');

    expect(result[0]).toEqual(
      expect.objectContaining({
        text: 'Stored content',
        estimatedTimeMin: 5,
      }),
    );
  });

  it('giữ full competencyDomains và lấy questionCategory theo domain đầu tiên', async () => {
    mockPrisma.questionBank.findMany.mockResolvedValue([
      {
        id: 'mixed-technical-primary',
        content: 'Describe a production bug and how you explained the fix.',
        difficulty: 3,
        contextPackId: 'VN',
        competencyDomains: ['TD5', 'D1'],
        estimatedTimeMin: 6,
        translations: null,
      },
    ]);

    const result = await service.selectFallbackQuestions('mixed', 'VN', 1, 'en');

    expect(result[0]).toEqual(
      expect.objectContaining({
        questionBankId: 'mixed-technical-primary',
        questionCategory: 'technical',
        competencyDomains: ['TD5', 'D1'],
      }),
    );
  });

  it('QG-10: query fallback chỉ theo sessionType, contextPack và non-deleted rows', async () => {
    mockPrisma.questionBank.findMany.mockResolvedValue([
      createMockQuestionBank({
        id: 'technical-vn-1',
        sessionType: 'technical',
        contextPackId: 'VN',
        difficulty: 2,
      }),
    ]);

    await service.selectFallbackQuestions('technical', 'VN', 1, 'vi');

    expect(mockPrisma.questionBank.findMany).toHaveBeenCalledWith({
      where: { sessionType: 'technical', contextPackId: 'VN', deletedAt: null },
      orderBy: [{ difficulty: 'asc' }, { createdAt: 'asc' }],
      take: 3,
      include: expect.any(Object),
    });
  });

  it('trả câu hỏi tiếng Anh khi chọn Western với language=en', async () => {
    mockPrisma.questionBank.findMany.mockResolvedValue([
      {
        id: 'western-1',
        content: 'Tell me about a time you handled stakeholder conflict.',
        difficulty: 3,
        contextPackId: 'Western',
        competencyDomains: ['D4'],
        estimatedTimeMin: 5,
        translations: {
          en: 'Tell me about a time you handled stakeholder conflict.',
          vi: 'Hãy kể về một lần bạn xử lý xung đột với stakeholder.',
        },
      },
    ]);

    const result = await service.selectFallbackQuestions(
      'hr',
      'Western',
      1,
      'en',
    );

    expect(mockPrisma.questionBank.findMany).toHaveBeenCalledWith({
      where: { sessionType: 'hr', contextPackId: 'Western', deletedAt: null },
      orderBy: [{ difficulty: 'asc' }, { createdAt: 'asc' }],
      take: 3,
      include: expect.any(Object),
    });
    expect(result[0]).toEqual(
      expect.objectContaining({
        questionBankId: 'western-1',
        text: 'Tell me about a time you handled stakeholder conflict.',
      }),
    );
  });

  it('QG-11: chọn 2 easy, 2 medium, 1 hard với count=5 theo Math.round hiện tại', async () => {
    mockPrisma.questionBank.findMany.mockResolvedValue([
      createMockQuestionBank({ id: 'easy-1', difficulty: 1 }),
      createMockQuestionBank({ id: 'easy-2', difficulty: 2 }),
      createMockQuestionBank({ id: 'easy-3', difficulty: 2 }),
      createMockQuestionBank({ id: 'medium-1', difficulty: 3 }),
      createMockQuestionBank({ id: 'medium-2', difficulty: 3 }),
      createMockQuestionBank({ id: 'medium-3', difficulty: 3 }),
      createMockQuestionBank({ id: 'hard-1', difficulty: 4 }),
      createMockQuestionBank({ id: 'hard-2', difficulty: 5 }),
    ]);

    const result = await service.selectFallbackQuestions(
      'technical',
      'VN',
      5,
      'vi',
    );

    expect(result.map((question) => question.questionBankId)).toEqual([
      'easy-1',
      'easy-2',
      'medium-1',
      'medium-2',
      'hard-1',
    ]);
  });

  it('QG-12: trả cùng thứ tự khi fallback chạy lặp với cùng dữ liệu', async () => {
    const candidates = [
      createMockQuestionBank({ id: 'easy-1', difficulty: 1 }),
      createMockQuestionBank({ id: 'easy-2', difficulty: 2 }),
      createMockQuestionBank({ id: 'medium-1', difficulty: 3 }),
      createMockQuestionBank({ id: 'medium-2', difficulty: 3 }),
      createMockQuestionBank({ id: 'hard-1', difficulty: 4 }),
    ];
    mockPrisma.questionBank.findMany.mockResolvedValue(candidates);

    const first = await service.selectFallbackQuestions(
      'technical',
      'VN',
      5,
      'vi',
    );
    const second = await service.selectFallbackQuestions(
      'technical',
      'VN',
      5,
      'vi',
    );

    expect(second.map((question) => question.questionBankId)).toEqual(
      first.map((question) => question.questionBankId),
    );
  });

  it('ưu tiên criteria relation thay vì competencyDomains compatibility cache', async () => {
    mockPrisma.questionBank.findMany.mockResolvedValue([
      {
        id: 'relation-first',
        content: 'Describe a production issue.',
        difficulty: 3,
        contextPackId: 'VN',
        competencyDomains: ['D1'],
        estimatedTimeMin: 5,
        translations: null,
        criteria: [
          {
            rubricCriterion: {
              id: 'criterion-td5',
              code: 'TD5',
              name: 'Debug',
              weight: 0.1,
              displayOrder: 5,
              active: true,
              rubricCategory: {
                contextPackId: 'VN',
                categoryKey: 'technical',
                displayOrder: 2,
              },
            },
          },
        ],
      },
    ]);

    const result = await service.selectFallbackQuestions(
      'technical',
      'VN',
      1,
      'en',
    );

    expect(result[0]).toEqual(
      expect.objectContaining({
        questionCategory: 'technical',
        competencyDomains: ['TD5'],
      }),
    );
  });

});
