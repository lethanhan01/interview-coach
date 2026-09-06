import { Test, TestingModule } from '@nestjs/testing';
import { ScoringEngineService } from './scoring-engine.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';

describe('ScoringEngineService', () => {
  let service: ScoringEngineService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      sessionSkill: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      sessionQuestion: {
        findMany: jest.fn(),
      },
      interviewSession: {
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringEngineService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ScoringEngineService>(ScoringEngineService);
  });

  describe('calculateQuestionScore', () => {
    it('nên tính 100 điểm khi đạt cả tiêu chí core và seniority', () => {
      const criteria = [
        { id: 'c1', dimension: 'core' as const, weight: 1.0 },
        { id: 'c2', dimension: 'seniority' as const, weight: 1.0 },
      ];
      const evaluations = [
        { criteriaId: 'c1', passed: true, evidence: 'Đạt core' },
        { criteriaId: 'c2', passed: true, evidence: 'Đạt seniority' },
      ];

      const result = service.calculateQuestionScore(evaluations, criteria);
      expect(result.questionScore).toBe(100);
      expect(result.criteriaPassRate).toBe(100);
      expect(result.corePassRate).toBe(1);
      expect(result.seniorityPassRate).toBe(1);
    });

    it('nên tính 50 điểm khi đạt core nhưng trượt seniority (trọng số bằng nhau)', () => {
      const criteria = [
        { id: 'c1', dimension: 'core' as const, weight: 1.0 },
        { id: 'c2', dimension: 'seniority' as const, weight: 1.0 },
      ];
      const evaluations = [
        { criteriaId: 'c1', passed: true, evidence: 'Đạt core' },
        { criteriaId: 'c2', passed: false, evidence: 'Trượt seniority' },
      ];

      const result = service.calculateQuestionScore(evaluations, criteria);
      expect(result.questionScore).toBe(50);
      expect(result.criteriaPassRate).toBe(50);
      expect(result.corePassRate).toBe(1);
      expect(result.seniorityPassRate).toBe(0);
    });

    it('nên tính điểm theo trọng số tùy biến chính xác', () => {
      const criteria = [
        { id: 'c1', dimension: 'core' as const, weight: 2.0 },
        { id: 'c2', dimension: 'seniority' as const, weight: 1.0 },
      ];
      const evaluations = [
        { criteriaId: 'c1', passed: true, evidence: 'Đạt core' },
        { criteriaId: 'c2', passed: false, evidence: 'Trượt seniority' },
      ];

      // Total weight: 3.0, passed: 2.0 -> 2/3 = 66.67% -> Round = 67
      const result = service.calculateQuestionScore(evaluations, criteria);
      expect(result.questionScore).toBe(67);
      expect(result.criteriaPassRate).toBe(66.67);
      expect(result.corePassRate).toBe(1);
      expect(result.seniorityPassRate).toBe(0);
    });

    it('nên trả về 0 điểm khi danh sách tiêu chí rỗng', () => {
      const result = service.calculateQuestionScore([], []);
      expect(result.questionScore).toBe(0);
      expect(result.criteriaPassRate).toBe(0);
    });

    it('nên xử lý chuẩn xác dimension có chữ hoa và khoảng trắng thừa', () => {
      const criteria = [
        { id: 'c1', dimension: ' CORE ' as any, weight: 1.0 },
        { id: 'c2', dimension: 'Seniority ' as any, weight: 1.0 },
      ];
      const evaluations = [
        { criteriaId: 'c1', passed: true, evidence: 'Đạt core' },
        { criteriaId: 'c2', passed: false, evidence: 'Trượt seniority' },
      ];

      const result = service.calculateQuestionScore(evaluations, criteria);
      expect(result.questionScore).toBe(50);
      expect(result.corePassRate).toBe(1);
      expect(result.seniorityPassRate).toBe(0);
    });
  });

  describe('inferDemonstratedLevel', () => {
    it('nên suy luận targetLevel khi đạt cả 2 chiều core và seniority', () => {
      const level = service.inferDemonstratedLevel(4, 1.0, 1.0);
      expect(level).toBe(4);
    });

    it('nên suy luận targetLevel - 1 khi đạt core nhưng trượt seniority (Senior làm việc như Middle)', () => {
      const level = service.inferDemonstratedLevel(4, 1.0, 0.0);
      expect(level).toBe(3);
    });

    it('nên suy luận targetLevel - 2 khi trượt chiều cốt lõi core (hổng kiến thức chuyên môn)', () => {
      const level = service.inferDemonstratedLevel(4, 0.0, 1.0);
      expect(level).toBe(2);
    });

    it('nên chặn sàn ở Level 1, không bao giờ bị âm hoặc bằng 0', () => {
      const levelJunior = service.inferDemonstratedLevel(2, 0.0, 0.0); // 2 - 2 = 0 -> chặn sàn 1
      expect(levelJunior).toBe(1);

      const levelIntern = service.inferDemonstratedLevel(1, 0.0, 0.0); // 1 - 2 = -1 -> chặn sàn 1
      expect(levelIntern).toBe(1);
    });

    it('nên chặn trần ở targetLevel, không bao giờ vượt quá cấp bậc phỏng vấn', () => {
      const level = service.inferDemonstratedLevel(3, 1.0, 1.0);
      expect(level).toBe(3);
    });
  });

  describe('buildSkippedFeedbackData', () => {
    it('nên tạo cấu trúc feedback mặc định điểm 0 và Level 1 cho câu hỏi bị bỏ qua', () => {
      const criteria = [
        { id: 'crit_1', dimension: 'core' as const },
        { id: 'crit_2', dimension: 'seniority' as const },
      ];

      const skipped = service.buildSkippedFeedbackData(criteria, 4);
      expect(skipped.overallScore).toBe(0);
      expect(skipped.demonstratedLevel).toBe(1);
      expect(skipped.criteriaPassRate).toBe(0);
      expect(skipped.criteriaEvaluations).toHaveLength(2);
      expect(skipped.criteriaEvaluations[0].passed).toBe(false);
      expect(skipped.criteriaEvaluations[1].passed).toBe(false);
    });
  });

  describe('aggregateSessionSkillScores', () => {
    it('nên tổng hợp điểm số và cấp độ cho các kỹ năng và cập nhật session overallScore', async () => {
      const sessionId = 'session-123';

      mockPrisma.sessionSkill.findMany
        .mockResolvedValueOnce([
          { id: 'skill-1', sessionId, skillCode: 'PROG', targetLevel: 4, weight: 2.0 },
          { id: 'skill-2', sessionId, skillCode: 'DBDS', targetLevel: 3, weight: 1.0 },
        ])
        .mockResolvedValueOnce([
          { id: 'skill-1', score: 85, weight: 2.0 },
          { id: 'skill-2', score: 40, weight: 1.0 },
        ]);

      mockPrisma.sessionQuestion.findMany.mockResolvedValue([
        {
          id: 'q1',
          sessionId,
          sessionSkillId: 'skill-1',
          userAnswers: [{ skipped: false, aiFeedback: { overallScore: 90, demonstratedLevel: 4 } }],
        },
        {
          id: 'q2',
          sessionId,
          sessionSkillId: 'skill-1',
          userAnswers: [{ skipped: false, aiFeedback: { overallScore: 80, demonstratedLevel: 4 } }],
        },
        {
          id: 'q3',
          sessionId,
          sessionSkillId: 'skill-2',
          userAnswers: [{ skipped: true, aiFeedback: null }], // câu hỏi bị skip
        },
      ]);

      mockPrisma.sessionSkill.update.mockResolvedValue({});
      mockPrisma.interviewSession.update.mockResolvedValue({});

      await service.aggregateSessionSkillScores(sessionId);

      // skill-1: 2 questions (90, 80) -> avg score 85, avg level 4
      expect(mockPrisma.sessionSkill.update).toHaveBeenCalledWith({
        where: { id: 'skill-1' },
        data: { score: 85, actualLevel: 4 },
      });

      // skill-2: 1 question skipped -> score 0, level 1
      expect(mockPrisma.sessionSkill.update).toHaveBeenCalledWith({
        where: { id: 'skill-2' },
        data: { score: 0, actualLevel: 1 },
      });

      // session overallScore: (85 * 2 + 40 * 1) / 3 = 210 / 3 = 70
      expect(mockPrisma.interviewSession.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: { overallScore: 70 },
      });
    });
  });
});
