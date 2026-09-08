import { SkillTargetedQuestionGeneratorService } from './skill-targeted-question-generator.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { createMockPrismaService } from '@core/test-utils/mock-factories';

describe('SkillTargetedQuestionGeneratorService', () => {
  let service: SkillTargetedQuestionGeneratorService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockAiGateway: {
    generateStructured: jest.Mock;
  };
  let mockSfiaFacade: {
    getSkillByCode: jest.Mock;
    getLevel: jest.Mock;
  };

  beforeEach(() => {
    mockPrisma = createMockPrismaService();
    mockAiGateway = {
      generateStructured: jest.fn(),
    };
    mockSfiaFacade = {
      getSkillByCode: jest.fn().mockResolvedValue({
        code: 'PROG',
        name: 'Software Development',
        overallDescription:
          'The design, creation, testing and documenting of new and amended software.',
      }),
      getLevel: jest.fn().mockResolvedValue({
        levelId: 4,
        name: 'Enable',
        essence: 'Technical specialist, works independently and guides others.',
      }),
    };

    service = new SkillTargetedQuestionGeneratorService(
      mockPrisma as unknown as PrismaService,
      mockAiGateway as any,
      mockSfiaFacade as any,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('sinh câu hỏi AI thành công với đúng 2 tiêu chí nhị phân', async () => {
    mockAiGateway.generateStructured.mockResolvedValueOnce({
      questionText:
        'Trong hệ thống microservices NestJS, bạn xử lý race condition khi update balance ví điện tử như thế nào?',
      estimatedTimeMin: 6,
      rubricCriteria: [
        {
          id: 'crit_core',
          text: 'Giải thích và áp dụng được Pessimistic Locking hoặc Optimistic Locking (kèm version column)',
          dimension: 'core',
          weight: 1.0,
        },
        {
          id: 'crit_seniority',
          text: 'Phân tích được trade-off giữa tính toàn vẹn dữ liệu (Consistency) và throughput của hệ thống tải lớn',
          dimension: 'seniority',
          weight: 1.0,
        },
      ],
    });

    const result = await service.generateQuestion({
      sessionType: 'technical',
      skillCode: 'PROG',
      targetLevel: 4,
      techContext: ['NestJS', 'PostgreSQL'],
      jobDescriptionText:
        'Tuyển Senior Backend Developer thành thạo NestJS và Postgres.',
      language: 'vi',
    });

    expect(result.source).toBe('ai_generated');
    expect(result.questionText).toContain('NestJS');
    expect(result.rubricCriteria).toHaveLength(2);
    expect(result.rubricCriteria[0].dimension).toBe('core');
    expect(result.rubricCriteria[1].dimension).toBe('seniority');
    expect(mockAiGateway.generateStructured).toHaveBeenCalledTimes(1);
  });

  it('kích hoạt resilience fallback lấy câu hỏi từ QuestionBank khi AI Gateway gặp sự cố', async () => {
    mockAiGateway.generateStructured.mockRejectedValueOnce(
      new Error('AI Gateway Timeout: 504 Gateway Timeout'),
    );

    mockPrisma.questionBank.findFirst.mockResolvedValueOnce({
      id: 'qb-fb-1',
      content: 'Explain database transaction isolation levels.',
      difficulty: 4,
      estimatedTimeMin: 5,
      translations: {
        vi: 'Giải thích các mức cô lập transaction trong database.',
      },
      questionCriteria: [
        {
          id: 'c-fb-1',
          criteriaText:
            'Nêu đúng 4 mức cô lập (Read Uncommitted, Read Committed, Repeatable Read, Serializable)',
          dimension: 'core',
          weight: 1.0,
        },
        {
          id: 'c-fb-2',
          criteriaText:
            'Phân tích được hiện tượng Phantom Read và Serializable Snapshot Isolation',
          dimension: 'seniority',
          weight: 1.0,
        },
      ],
    });

    const result = await service.generateQuestion({
      sessionType: 'technical',
      skillCode: 'DBDS',
      targetLevel: 4,
      techContext: ['PostgreSQL'],
      jobDescriptionText: 'Database engineer',
      language: 'vi',
    });

    expect(result.source).toBe('bank');
    expect(result.questionBankId).toBe('qb-fb-1');
    expect(result.questionText).toBe(
      'Giải thích các mức cô lập transaction trong database.',
    );
    expect(result.rubricCriteria).toHaveLength(2);
    expect(result.rubricCriteria[0].dimension).toBe('core');
    expect(result.rubricCriteria[1].dimension).toBe('seniority');
  });

  it('tự sinh câu hỏi an toàn mặc định khi cả AI Gateway và QuestionBank đều không có dữ liệu', async () => {
    mockAiGateway.generateStructured.mockRejectedValueOnce(
      new Error('Connection Refused'),
    );
    mockPrisma.questionBank.findFirst.mockResolvedValueOnce(null);

    const result = await service.generateQuestion({
      sessionType: 'technical',
      skillCode: 'PROG',
      targetLevel: 4,
      techContext: ['TypeScript'],
      jobDescriptionText: 'Job description',
      language: 'vi',
    });

    expect(result.source).toBe('ai_generated');
    expect(result.questionText).toContain('PROG');
    expect(result.rubricCriteria).toHaveLength(2);
    expect(result.rubricCriteria[0].dimension).toBe('core');
    expect(result.rubricCriteria[1].dimension).toBe('seniority');
  });
});
