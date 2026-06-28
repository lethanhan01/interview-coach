import { QuestionBankService } from './question-bank.service';
import { createMockPrismaService } from '../test-utils/mock-factories';

describe('QuestionBankService', () => {
  let service: QuestionBankService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    mockPrisma = createMockPrismaService();
    service = new QuestionBankService(mockPrisma as any);
  });

  afterEach(() => jest.clearAllMocks());

  it('chọn fallback questions theo spread độ khó và resolve text theo language', async () => {
    mockPrisma.questionBank.findMany.mockResolvedValue([
      {
        id: 'easy-1',
        content: 'English fallback',
        difficulty: 2,
        competencyDomain: 'D4',
        estimatedTimeMin: 3,
        translations: { en: 'English fallback', vi: 'Câu hỏi tiếng Việt' },
      },
      {
        id: 'medium-1',
        content: 'Medium fallback',
        difficulty: 3,
        competencyDomain: 'TD4',
        estimatedTimeMin: 5,
        translations: { en: 'Medium fallback', vi: 'Câu kỹ thuật' },
      },
      {
        id: 'hard-1',
        content: 'Hard fallback',
        difficulty: 4,
        competencyDomain: 'TD5',
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
        competencyDomain: 'D4',
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

  it('ghi usage cho question bank', async () => {
    await service.recordUsage('qb-1', 'session-1', 'user-1');

    expect(mockPrisma.questionUsage.create).toHaveBeenCalledWith({
      data: {
        questionBankId: 'qb-1',
        sessionId: 'session-1',
        userId: 'user-1',
      },
    });
  });
});
