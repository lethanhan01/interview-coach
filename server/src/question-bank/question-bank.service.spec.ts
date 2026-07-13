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
      mockQuestionBankWithCriteria({
        id: 'easy-1',
        content: 'English fallback',
        difficulty: 2,
        contextPackId: 'VN',
        criterionCodes: ['D4'],
        estimatedTimeMin: 3,
        translations: { en: 'English fallback', vi: 'Câu hỏi tiếng Việt' },
      }),
      mockQuestionBankWithCriteria({
        id: 'medium-1',
        content: 'Medium fallback',
        difficulty: 3,
        contextPackId: 'VN',
        criterionCodes: ['TD4'],
        estimatedTimeMin: 5,
        translations: { en: 'Medium fallback', vi: 'Câu kỹ thuật' },
      }),
      mockQuestionBankWithCriteria({
        id: 'hard-1',
        content: 'Hard fallback',
        difficulty: 4,
        contextPackId: 'VN',
        criterionCodes: ['TD5'],
        estimatedTimeMin: 7,
        translations: { en: 'Hard fallback', vi: 'Câu khó' },
      }),
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
      mockQuestionBankWithCriteria({
        id: 'qb-1',
        content: 'Stored content',
        difficulty: 2,
        contextPackId: 'VN',
        criterionCodes: ['D4'],
        estimatedTimeMin: null,
        translations: { en: 'Stored content' },
      }),
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
      mockQuestionBankWithCriteria({
        id: 'mixed-technical-primary',
        content: 'Describe a production bug and how you explained the fix.',
        difficulty: 3,
        contextPackId: 'VN',
        criterionCodes: ['TD5', 'TD1'],
        estimatedTimeMin: 6,
        translations: null,
      }),
    ]);

    const result = await service.selectFallbackQuestions(
      'mixed',
      'VN',
      1,
      'en',
    );

    expect(result[0]).toEqual(
      expect.objectContaining({
        questionBankId: 'mixed-technical-primary',
        questionCategory: 'technical',
        competencyDomains: ['TD5', 'TD1'],
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
      mockQuestionBankWithCriteria({
        id: 'western-1',
        content: 'Tell me about a time you handled stakeholder conflict.',
        difficulty: 3,
        contextPackId: 'Western',
        criterionCodes: ['D4'],
        estimatedTimeMin: 5,
        translations: {
          en: 'Tell me about a time you handled stakeholder conflict.',
          vi: 'Hãy kể về một lần bạn xử lý xung đột với stakeholder.',
        },
      }),
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

  it('đọc criteria relation làm source of truth', async () => {
    mockPrisma.questionBank.findMany.mockResolvedValue([
      mockQuestionBankWithCriteria({
        id: 'relation-first',
        content: 'Describe a production issue.',
        difficulty: 3,
        contextPackId: 'VN',
        criterionCodes: ['TD5'],
        estimatedTimeMin: 5,
        translations: null,
      }),
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

function mockQuestionBankWithCriteria(input: {
  id: string;
  content: string;
  difficulty: number;
  contextPackId: string;
  criterionCodes: string[];
  estimatedTimeMin: number | null;
  translations: Record<string, string> | null;
}) {
  return {
    id: input.id,
    content: input.content,
    difficulty: input.difficulty,
    contextPackId: input.contextPackId,
    estimatedTimeMin: input.estimatedTimeMin,
    translations: input.translations,
    criteria: input.criterionCodes.map((code, index) => ({
      rubricCriterion: {
        id: `criterion-${code}`,
        code,
        name: code,
        weight: 1,
        displayOrder: index + 1,
        rubricVersionId: `rubric-version-${input.contextPackId}`,
        rubricCategory: {
          categoryKey: code.startsWith('TD') ? 'technical' : 'behavioral',
          displayOrder: code.startsWith('TD') ? 2 : 1,
        },
        rubricVersion: {
          contextPackId: input.contextPackId,
          status: 'active',
        },
      },
    })),
  };
}
