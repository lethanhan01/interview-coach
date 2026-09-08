import { QuestionBankService } from './question-bank.service';
import { QuestionCriteriaService } from '../question-criteria/question-criteria.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import {
  createMockPrismaService,
  createMockQuestionBank,
} from '@core/test-utils/mock-factories';

describe('QuestionBankService', () => {
  let service: QuestionBankService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(() => {
    mockPrisma = createMockPrismaService();
    service = new QuestionBankService(
      mockPrisma as unknown as PrismaService,
      new QuestionCriteriaService(mockPrisma as unknown as PrismaService),
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
        id: 'technical-primary',
        content: 'Describe a production bug and how you explained the fix.',
        difficulty: 3,
        contextPackId: 'VN',
        criterionCodes: ['TD5', 'TD1'],
        estimatedTimeMin: 6,
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
        questionBankId: 'technical-primary',
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

  describe('allocateQuestionsForSessionSkills (Hybrid Integration)', () => {
    it('trả về rỗng khi không có sessionSkills hoặc totalQuestions <= 0', async () => {
      const resultEmpty = await service.allocateQuestionsForSessionSkills({
        sessionSkills: [],
        totalQuestions: 5,
        sessionType: 'technical',
        language: 'vi',
      });
      expect(resultEmpty.allocatedQuestions).toEqual([]);
      expect(resultEmpty.uncoveredRequirements).toEqual([]);

      const resultZero = await service.allocateQuestionsForSessionSkills({
        sessionSkills: [
          {
            sessionSkillId: 'sk-1',
            skillCode: 'PROG',
            targetLevel: 4,
            weight: 1.5,
          },
        ],
        totalQuestions: 0,
        sessionType: 'technical',
        language: 'vi',
      });
      expect(resultZero.allocatedQuestions).toEqual([]);
    });

    it('phân bổ đủ câu hỏi theo trọng số và khớp chính xác Target Level', async () => {
      const skills = [
        {
          sessionSkillId: 'sk-prog',
          skillCode: 'PROG',
          targetLevel: 4,
          weight: 1.5,
        },
        {
          sessionSkillId: 'sk-dbds',
          skillCode: 'DBDS',
          targetLevel: 3,
          weight: 1.0,
        },
      ];

      // totalQuestions = 3 -> PROG (weight 1.5) được 2 câu, DBDS (weight 1.0) được 1 câu
      mockPrisma.questionBank.findMany
        .mockResolvedValueOnce([
          {
            id: 'q-prog-1',
            content: 'How does Event Loop work in Node.js?',
            difficulty: 3,
            estimatedTimeMin: 5,
            translations: {
              vi: 'Event loop trong Node.js hoạt động như thế nào?',
            },
            questionCriteria: [
              {
                id: 'crit-1',
                criteriaText: 'Hiểu rõ các phases của Event Loop',
                dimension: 'core',
                weight: 1.0,
              },
              {
                id: 'crit-2',
                criteriaText:
                  'Phân tích được trade-off khi offload task nặng sang worker threads',
                dimension: 'seniority',
                weight: 1.0,
              },
            ],
          },
          {
            id: 'q-prog-2',
            content: 'Explain memory leak detection in V8.',
            difficulty: 4,
            estimatedTimeMin: 5,
            translations: null,
            questionCriteria: [],
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'q-dbds-1',
            content: 'Explain B-Tree Index in PostgreSQL.',
            difficulty: 3,
            estimatedTimeMin: 5,
            translations: {
              vi: 'Giải thích nguyên lý B-Tree Index trong Postgres.',
            },
            questionCriteria: [
              {
                id: 'crit-db-1',
                criteriaText: 'Nêu đúng cấu trúc B-Tree',
                dimension: 'core',
                weight: 1.0,
              },
              {
                id: 'crit-db-2',
                criteriaText: 'Đánh giá trade-off ghi khi có quá nhiều index',
                dimension: 'seniority',
                weight: 1.0,
              },
            ],
          },
        ]);

      const result = await service.allocateQuestionsForSessionSkills({
        sessionSkills: skills,
        totalQuestions: 3,
        sessionType: 'technical',
        language: 'vi',
      });

      expect(result.allocatedQuestions).toHaveLength(3);
      expect(result.uncoveredRequirements).toHaveLength(0);

      const progAllocated = result.allocatedQuestions.filter(
        (q) => q.sfiaSkillCode === 'PROG',
      );
      expect(progAllocated).toHaveLength(2);
      const progTexts = progAllocated.map((q) => q.questionText);
      expect(progTexts).toContain(
        'Event loop trong Node.js hoạt động như thế nào?',
      );
      expect(progTexts).toContain('Explain memory leak detection in V8.');

      const withCriteria = progAllocated.find(
        (q) => q.questionBankId === 'q-prog-1',
      );
      expect(withCriteria?.rubricCriteria).toHaveLength(2);
      expect(withCriteria?.rubricCriteria[0].dimension).toBe('core');
      expect(withCriteria?.rubricCriteria[1].dimension).toBe('seniority');

      // Khi câu hỏi không có questionCriteria, tự sinh fallback criteria
      const withoutCriteria = progAllocated.find(
        (q) => q.questionBankId === 'q-prog-2',
      );
      expect(withoutCriteria?.rubricCriteria).toHaveLength(2);

      const dbdsAllocated = result.allocatedQuestions.filter(
        (q) => q.sfiaSkillCode === 'DBDS',
      );
      expect(dbdsAllocated).toHaveLength(1);
      expect(dbdsAllocated[0].questionText).toBe(
        'Giải thích nguyên lý B-Tree Index trong Postgres.',
      );
    });

    it('cắt giảm top skills theo trọng số khi totalQuestions < sessionSkills.length', async () => {
      const skills = [
        {
          sessionSkillId: 'sk-1',
          skillCode: 'PROG',
          targetLevel: 4,
          weight: 1.5,
        },
        {
          sessionSkillId: 'sk-2',
          skillCode: 'DBDS',
          targetLevel: 4,
          weight: 1.2,
        },
        {
          sessionSkillId: 'sk-3',
          skillCode: 'ARCH',
          targetLevel: 4,
          weight: 1.0,
        },
      ];

      // totalQuestions = 2 -> Chỉ chọn PROG và DBDS
      mockPrisma.questionBank.findMany
        .mockResolvedValueOnce([
          {
            id: 'q-1',
            content: 'Question 1',
            difficulty: 3,
            estimatedTimeMin: 5,
            translations: null,
            questionCriteria: [],
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'q-2',
            content: 'Question 2',
            difficulty: 3,
            estimatedTimeMin: 5,
            translations: null,
            questionCriteria: [],
          },
        ]);

      const result = await service.allocateQuestionsForSessionSkills({
        sessionSkills: skills,
        totalQuestions: 2,
        sessionType: 'technical',
        language: 'vi',
      });

      expect(result.allocatedQuestions).toHaveLength(2);
      const allocatedCodes = result.allocatedQuestions.map(
        (q) => q.sfiaSkillCode,
      );
      expect(allocatedCodes).toContain('PROG');
      expect(allocatedCodes).toContain('DBDS');
      expect(allocatedCodes).not.toContain('ARCH');
    });

    it('fallback sang level lân cận (+/- 1 Level) khi ngân hàng thiếu câu hỏi đúng level', async () => {
      const skills = [
        {
          sessionSkillId: 'sk-1',
          skillCode: 'DESN',
          targetLevel: 4,
          weight: 1.0,
        },
      ];

      // Lần gọi 1 (Exact Level 4): Không có câu nào
      mockPrisma.questionBank.findMany.mockResolvedValueOnce([]);

      // Lần gọi 2 (Adjacent Levels 3 và 5): Tìm thấy 1 câu Level 3
      mockPrisma.questionBank.findMany.mockResolvedValueOnce([
        {
          id: 'q-desn-lvl3',
          content: 'Describe design patterns in practice.',
          difficulty: 3,
          estimatedTimeMin: 5,
          translations: null,
          questionCriteria: [
            {
              id: 'c-1',
              criteriaText: 'Nêu đúng pattern',
              dimension: 'core',
              weight: 1.0,
            },
            {
              id: 'c-2',
              criteriaText: 'Phân tích trade-off',
              dimension: 'seniority',
              weight: 1.0,
            },
          ],
        },
      ]);

      const result = await service.allocateQuestionsForSessionSkills({
        sessionSkills: skills,
        totalQuestions: 1,
        sessionType: 'technical',
        language: 'en',
      });

      expect(result.allocatedQuestions).toHaveLength(1);
      expect(result.allocatedQuestions[0].questionBankId).toBe('q-desn-lvl3');
      // Target Level của câu hỏi lưu theo Target Level của session_skill (Level 4)
      expect(result.allocatedQuestions[0].targetLevel).toBe(4);
      expect(result.uncoveredRequirements).toHaveLength(0);
    });

    it('báo cáo uncoveredRequirements khi ngân hàng không đủ câu hỏi', async () => {
      const skills = [
        {
          sessionSkillId: 'sk-rare',
          skillCode: 'RARE',
          targetLevel: 5,
          weight: 1.0,
        },
      ];

      // Exact Level 5: rỗng
      mockPrisma.questionBank.findMany.mockResolvedValueOnce([]);
      // Adjacent Level 4, 6: cũng rỗng
      mockPrisma.questionBank.findMany.mockResolvedValueOnce([]);

      const result = await service.allocateQuestionsForSessionSkills({
        sessionSkills: skills,
        totalQuestions: 1,
        sessionType: 'technical',
        language: 'en',
      });

      expect(result.allocatedQuestions).toHaveLength(0);
      expect(result.uncoveredRequirements).toHaveLength(1);
      expect(result.uncoveredRequirements[0].requirement.skillCode).toBe(
        'RARE',
      );
      expect(result.uncoveredRequirements[0].neededCount).toBe(1);
    });
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
      criteria: {
        id: `level-${code}`,
        code,
        name: code,
        weight: 1,
        displayOrder: index + 1,
        competency: {
          code: code.split('-')[0] ?? code,
          name: code,
          categoryCode: code.startsWith('TD') ? 'DEV_IMPL' : 'BEHAVIORAL',
          categoryName: code.startsWith('TD') ? 'Development' : 'Behavioral',
        },
      },
    })),
  };
}
