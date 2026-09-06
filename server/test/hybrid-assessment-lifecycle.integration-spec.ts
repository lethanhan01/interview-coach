import { Test, TestingModule } from '@nestjs/testing';
import { ScoringEngineService } from '../src/modules/interview-assessment/evaluation/scoring-engine.service';
import { BinaryCriteriaEvaluatorService } from '../src/modules/interview-assessment/evaluation/binary-criteria-evaluator.service';
import { ZodValidatorService } from '../src/infrastructure/ai/zod-validator.service';
import { UnifiedReportGeneratorService } from '../src/modules/interview-assessment/report/services/unified-report-generator.service';
import { SFIA_FACADE_TOKEN } from '../src/modules/sfia/contracts/sfia.facade.interface';
import { AI_GATEWAY_TOKEN } from '../src/infrastructure/ai/ai-gateway.interface';
import { PrismaService } from '../src/infrastructure/database/prisma/prisma.service';
import { ReportService } from '../src/modules/interview-assessment/report/report.service';
import { WorkflowDispatcher } from '../src/infrastructure/workflow/workflow-dispatcher.service';

describe('Hybrid Assessment Lifecycle (End-to-End Integration)', () => {
  let scoringEngine: ScoringEngineService;
  let binaryEvaluator: BinaryCriteriaEvaluatorService;
  let unifiedReportGenerator: UnifiedReportGeneratorService;
  let reportService: ReportService;

  const mockSessionId = '99999999-9999-4999-8999-999999999999';
  const mockUserId = '88888888-8888-4888-8888-888888888888';

  // In-memory data store for the test
  const sessionRecord = {
    id: mockSessionId,
    userId: mockUserId,
    targetSfiaLevel: 4,
    onetSocCode: '15-1252.00',
    status: 'in_progress',
    overallScore: null as number | null,
    completedAt: null as Date | null,
    sessionType: 'technical',
  };

  const sessionSkillsMap = new Map<string, any>([
    [
      'skill-prog',
      {
        id: 'skill-prog',
        sessionId: mockSessionId,
        skillCode: 'PROG',
        sfiaSkillCode: 'PROG',
        targetLevel: 4,
        weight: 1.0,
        score: null,
        actualLevel: null,
      },
    ],
    [
      'skill-dbds',
      {
        id: 'skill-dbds',
        sessionId: mockSessionId,
        skillCode: 'DBDS',
        sfiaSkillCode: 'DBDS',
        targetLevel: 4,
        weight: 1.0,
        score: null,
        actualLevel: null,
      },
    ],
    [
      'skill-arch',
      {
        id: 'skill-arch',
        sessionId: mockSessionId,
        skillCode: 'ARCH',
        sfiaSkillCode: 'ARCH',
        targetLevel: 4,
        weight: 1.0,
        score: null,
        actualLevel: null,
      },
    ],
    [
      'skill-desn',
      {
        id: 'skill-desn',
        sessionId: mockSessionId,
        skillCode: 'DESN',
        sfiaSkillCode: 'DESN',
        targetLevel: 4,
        weight: 1.0,
        score: null,
        actualLevel: null,
      },
    ],
  ]);

  const sessionQuestions = [
    {
      id: 'q-prog',
      sessionId: mockSessionId,
      sessionSkillId: 'skill-prog',
      sfiaSkillCode: 'PROG',
      targetLevel: 4,
      orderIndex: 1,
      questionText: 'Explain memory management and async patterns in TypeScript/Node.js.',
      rubricCriteria: [
        {
          id: 'core',
          dimension: 'core' as const,
          description: 'Understands event loop, microtasks, and stream pipelines',
          weight: 0.6,
        },
        {
          id: 'seniority',
          dimension: 'seniority' as const,
          description: 'Discusses trade-offs in garbage collection and backpressure handling',
          weight: 0.4,
        },
      ],
    },
    {
      id: 'q-dbds',
      sessionId: mockSessionId,
      sessionSkillId: 'skill-dbds',
      sfiaSkillCode: 'DBDS',
      targetLevel: 4,
      orderIndex: 2,
      questionText: 'Design an indexing strategy for a multi-tenant PostgreSQL system.',
      rubricCriteria: [
        {
          id: 'core',
          dimension: 'core' as const,
          description: 'Identifies compound indexes and foreign key indexes',
          weight: 0.6,
        },
        {
          id: 'seniority',
          dimension: 'seniority' as const,
          description: 'Evaluates partial indexes, partitioning, and vacuum impact',
          weight: 0.4,
        },
      ],
    },
    {
      id: 'q-arch',
      sessionId: mockSessionId,
      sessionSkillId: 'skill-arch',
      sfiaSkillCode: 'ARCH',
      targetLevel: 4,
      orderIndex: 3,
      questionText: 'Design a high-availability event-driven architecture.',
      rubricCriteria: [
        {
          id: 'core',
          dimension: 'core' as const,
          description: 'Designs message broker, idempotent consumers, and dead-letter queues',
          weight: 0.6,
        },
        {
          id: 'seniority',
          dimension: 'seniority' as const,
          description: 'Addresses split-brain, distributed transactions (Saga/Outbox), and CDC',
          weight: 0.4,
        },
      ],
    },
    {
      id: 'q-desn',
      sessionId: mockSessionId,
      sessionSkillId: 'skill-desn',
      sfiaSkillCode: 'DESN',
      targetLevel: 4,
      orderIndex: 4,
      questionText: 'How do you structure micro-frontends and design token contracts?',
      rubricCriteria: [
        {
          id: 'core',
          dimension: 'core' as const,
          description: 'Component separation and CSS encapsulation',
          weight: 0.6,
        },
        {
          id: 'seniority',
          dimension: 'seniority' as const,
          description: 'Versioned design token pipeline and independent deployments',
          weight: 0.4,
        },
      ],
    },
  ];

  const userAnswersMap = new Map<string, any>();
  const aiFeedbacksMap = new Map<string, any>();
  const sessionReportsMap = new Map<string, any>();

  const mockPrisma = {
    interviewSession: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id === mockSessionId) {
          return {
            ...sessionRecord,
            savedJobDescription: { userId: mockUserId },
            sessionSkills: [...sessionSkillsMap.values()].filter(
              (s) => s.sessionId === mockSessionId,
            ),
            sessionQuestions: sessionQuestions
              .filter((q) => q.sessionId === mockSessionId)
              .map((q) => {
                const ans = userAnswersMap.get(
                  `ans-${q.sfiaSkillCode.toLowerCase()}`,
                );
                return {
                  ...q,
                  userAnswers: ans ? [ans] : [],
                };
              }),
            sessionReports: [...sessionReportsMap.values()].filter(
              (r) => r.sessionId === mockSessionId,
            ),
          };
        }
        return null;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        if (where.id === mockSessionId) {
          Object.assign(sessionRecord, data);
          return { ...sessionRecord };
        }
        return null;
      }),
    },
    sessionSkill: {
      findMany: jest.fn(async ({ where }: any) => {
        return [...sessionSkillsMap.values()].filter(
          (s) => s.sessionId === where.sessionId,
        );
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const skill = sessionSkillsMap.get(where.id);
        if (skill) {
          Object.assign(skill, data);
          return { ...skill };
        }
        return null;
      }),
    },
    sessionQuestion: {
      findMany: jest.fn(async ({ where }: any) => {
        return sessionQuestions
          .filter((q) => q.sessionId === where.sessionId)
          .map((q) => {
            const ans = userAnswersMap.get(`ans-${q.sfiaSkillCode.toLowerCase()}`);
            return {
              ...q,
              userAnswers: ans ? [ans] : [],
            };
          });
      }),
    },
    userAnswer: {
      findMany: jest.fn(async ({ where }: any) => {
        return [...userAnswersMap.values()].filter((a) => {
          if (where.question?.sessionId) {
            const q = sessionQuestions.find((sq) => sq.id === a.questionId);
            return q?.sessionId === where.question.sessionId;
          }
          return false;
        });
      }),
    },
    aiFeedback: {
      findUnique: jest.fn(async ({ where }: any) => {
        return aiFeedbacksMap.get(where.userAnswerId) ?? null;
      }),
      create: jest.fn(async ({ data }: any) => {
        aiFeedbacksMap.set(data.userAnswerId, data);
        return data;
      }),
    },
    sessionReport: {
      findUnique: jest.fn(async ({ where }: any) => {
        const key = `${where.sessionId_reportType_version.sessionId}:${where.sessionId_reportType_version.reportType}:${where.sessionId_reportType_version.version}`;
        return sessionReportsMap.get(key) ?? null;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        return [...sessionReportsMap.values()].filter(
          (r) => r.sessionId === where.sessionId,
        );
      }),
      upsert: jest.fn(async ({ where, create, update }: any) => {
        const key = `${where.sessionId_reportType_version.sessionId}:${where.sessionId_reportType_version.reportType}:${where.sessionId_reportType_version.version}`;
        const existing = sessionReportsMap.get(key);
        const record = existing ? { ...existing, ...update } : { ...create };
        sessionReportsMap.set(key, record);
        return record;
      }),
    },
    $transaction: jest.fn(async (cb: any) => cb(mockPrisma)),
  };

  const mockSfiaFacade = {
    getSkill: jest.fn((code: string) => {
      const names: Record<string, string> = {
        PROG: 'Software development',
        DBDS: 'Database design',
        ARCH: 'Solution architecture',
        DESN: 'Systems design',
      };
      return {
        code,
        name: names[code] || code,
        category: 'Development',
        description: `Official SFIA description for ${code}`,
      };
    }),
    getLevel: jest.fn((level: number) => ({
      level,
      name: `Level ${level}`,
      essence: `Autonomy and influence level ${level}`,
    })),
  };

  const mockAiGateway = {
    generateStructured: jest.fn(),
    chatCompletion: jest.fn(async () =>
      JSON.stringify({
        executive_summary:
          'Ứng viên thể hiện nền tảng lập trình tốt nhưng cần nâng cao kỹ năng thiết kế kiến trúc và hệ thống cơ sở dữ liệu lớn.',
        action_plan: [
          {
            priority: 'high',
            skill_code: 'ARCH',
            title: 'Học tập về Distributed Systems & Event-driven Architecture',
            timeframe: '30_days',
            recommended_actions: [
              'Nghiên cứu transactional outbox pattern',
              'Thực hành xử lý idempotent consumer',
            ],
          },
          {
            priority: 'medium',
            skill_code: 'DBDS',
            title: 'Tối ưu hóa Index & Partitioning trong PostgreSQL',
            timeframe: '60_days',
            recommended_actions: ['Phân tích EXPLAIN ANALYZE trên bảng lớn'],
          },
        ],
      }),
    ),
  };

  const mockSseService = {
    emit: jest.fn(),
  };

  const mockWorkflowDispatcher = {
    dispatchWorkflowCommand: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringEngineService,
        BinaryCriteriaEvaluatorService,
        ZodValidatorService,
        UnifiedReportGeneratorService,
        ReportService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SFIA_FACADE_TOKEN, useValue: mockSfiaFacade },
        { provide: AI_GATEWAY_TOKEN, useValue: mockAiGateway },
        { provide: WorkflowDispatcher, useValue: mockWorkflowDispatcher },
      ],
    }).compile();

    scoringEngine = module.get<ScoringEngineService>(ScoringEngineService);
    binaryEvaluator = module.get<BinaryCriteriaEvaluatorService>(
      BinaryCriteriaEvaluatorService,
    );
    unifiedReportGenerator = module.get<UnifiedReportGeneratorService>(
      UnifiedReportGeneratorService,
    );
    reportService = module.get<ReportService>(ReportService);
  });

  it('completes the full hybrid assessment lifecycle: Evaluation -> Deterministic Scoring -> Session Skill Aggregation -> Unified Competency Report', async () => {
    // ------------------------------------------------------------------------
    // BƯỚC 1: ĐÁNH GIÁ 4 CÂU HỎI VỚI 4 TÌNH HUỐNG NĂNG LỰC ĐIỂN HÌNH
    // ------------------------------------------------------------------------

    // Câu 1 (PROG Level 4): Ứng viên xuất sắc, đạt cả Core (0.6) và Seniority (0.4)
    const q1Criteria = sessionQuestions[0].rubricCriteria;
    const q1Evaluation = [
      {
        criteriaId: 'core',
        passed: true,
        evidence: 'Giải thích đúng event loop và stream pipeline',
      },
      {
        criteriaId: 'seniority',
        passed: true,
        evidence: 'Phân tích sâu backpressure và tối ưu bộ nhớ GC',
      },
    ];
    const q1ScoreResult = scoringEngine.calculateQuestionScore(
      q1Evaluation,
      q1Criteria,
    );
    const q1DemonstratedLevel = scoringEngine.inferDemonstratedLevel(
      sessionQuestions[0].targetLevel,
      q1ScoreResult.corePassRate,
      q1ScoreResult.seniorityPassRate,
    );

    expect(q1ScoreResult.questionScore).toBe(100);
    expect(q1ScoreResult.corePassRate).toBe(1.0);
    expect(q1ScoreResult.seniorityPassRate).toBe(1.0);
    expect(q1DemonstratedLevel).toBe(4); // Giữ nguyên Target Level 4

    userAnswersMap.set('ans-prog', {
      id: 'ans-prog',
      questionId: 'q-prog',
      skipped: false,
      aiFeedback: {
        overallScore: q1ScoreResult.questionScore,
        demonstratedLevel: q1DemonstratedLevel,
      },
    });

    // Câu 2 (DBDS Level 4): Đạt Core (0.6), trượt Seniority (0.4) do thiếu kinh nghiệm partitioning
    const q2Criteria = sessionQuestions[1].rubricCriteria;
    const q2Evaluation = [
      {
        criteriaId: 'core',
        passed: true,
        evidence: 'Thiết kế chỉ mục kết hợp đúng đắn',
      },
      {
        criteriaId: 'seniority',
        passed: false,
        evidence: 'Chưa tính toán được vacuum overhead và sharding',
      },
    ];
    const q2ScoreResult = scoringEngine.calculateQuestionScore(
      q2Evaluation,
      q2Criteria,
    );
    const q2DemonstratedLevel = scoringEngine.inferDemonstratedLevel(
      sessionQuestions[1].targetLevel,
      q2ScoreResult.corePassRate,
      q2ScoreResult.seniorityPassRate,
    );

    expect(q2ScoreResult.questionScore).toBe(60);
    expect(q2ScoreResult.corePassRate).toBe(1.0);
    expect(q2ScoreResult.seniorityPassRate).toBe(0.0);
    expect(q2DemonstratedLevel).toBe(3); // Trừ 1 level vì trượt seniority

    userAnswersMap.set('ans-dbds', {
      id: 'ans-dbds',
      questionId: 'q-dbds',
      skipped: false,
      aiFeedback: {
        overallScore: q2ScoreResult.questionScore,
        demonstratedLevel: q2DemonstratedLevel,
      },
    });

    // Câu 3 (ARCH Level 4): Trượt cả Core (0.6) và Seniority (0.4)
    const q3Criteria = sessionQuestions[2].rubricCriteria;
    const q3Evaluation = [
      {
        criteriaId: 'core',
        passed: false,
        evidence: 'Không nêu được kiến trúc dead-letter queue',
      },
      {
        criteriaId: 'seniority',
        passed: false,
        evidence: 'Không giải thích được split-brain',
      },
    ];
    const q3ScoreResult = scoringEngine.calculateQuestionScore(
      q3Evaluation,
      q3Criteria,
    );
    const q3DemonstratedLevel = scoringEngine.inferDemonstratedLevel(
      sessionQuestions[2].targetLevel,
      q3ScoreResult.corePassRate,
      q3ScoreResult.seniorityPassRate,
    );

    expect(q3ScoreResult.questionScore).toBe(0);
    expect(q3ScoreResult.corePassRate).toBe(0.0);
    expect(q3ScoreResult.seniorityPassRate).toBe(0.0);
    expect(q3DemonstratedLevel).toBe(2); // Trừ 2 level vì hổng kiến thức core

    userAnswersMap.set('ans-arch', {
      id: 'ans-arch',
      questionId: 'q-arch',
      skipped: false,
      aiFeedback: {
        overallScore: q3ScoreResult.questionScore,
        demonstratedLevel: q3DemonstratedLevel,
      },
    });

    // Câu 4 (DESN Level 4): Ứng viên bấm Bỏ qua (Skip)
    const skippedData = scoringEngine.buildSkippedFeedbackData(
      sessionQuestions[3].rubricCriteria as any,
      sessionQuestions[3].targetLevel,
    );
    expect(skippedData.overallScore).toBe(0);
    expect(skippedData.demonstratedLevel).toBe(1); // Skip bị phạt xuống Level 1

    userAnswersMap.set('ans-desn', {
      id: 'ans-desn',
      questionId: 'q-desn',
      skipped: true,
      aiFeedback: {
        overallScore: skippedData.overallScore,
        demonstratedLevel: skippedData.demonstratedLevel,
      },
    });

    // ------------------------------------------------------------------------
    // BƯỚC 2: AGGREGATE SESSION SKILL SCORES VÀO CSDL
    // ------------------------------------------------------------------------
    await scoringEngine.aggregateSessionSkillScores(mockSessionId, mockPrisma as any);

    // Xác nhận kết quả tổng hợp của từng kỹ năng:
    const progSkill = sessionSkillsMap.get('skill-prog');
    expect(progSkill.score).toBe(100);
    expect(progSkill.actualLevel).toBe(4);

    const dbdsSkill = sessionSkillsMap.get('skill-dbds');
    expect(dbdsSkill.score).toBe(60);
    expect(dbdsSkill.actualLevel).toBe(3);

    const archSkill = sessionSkillsMap.get('skill-arch');
    expect(archSkill.score).toBe(0);
    expect(archSkill.actualLevel).toBe(2);

    const desnSkill = sessionSkillsMap.get('skill-desn');
    expect(desnSkill.score).toBe(0);
    expect(desnSkill.actualLevel).toBe(1);

    // Điểm tổng phiên = trung bình cộng 4 kỹ năng = (100 + 60 + 0 + 0) / 4 = 40
    expect(sessionRecord.overallScore).toBe(40);

    // ------------------------------------------------------------------------
    // BƯỚC 3: SINH BÁO CÁO NĂNG LỰC HỢP NHẤT (UNIFIED COMPETENCY REPORT)
    // ------------------------------------------------------------------------
    await unifiedReportGenerator.generateReport(mockSessionId, 'vi');

    // Phiên phải được chuyển sang completed
    expect(sessionRecord.status).toBe('completed');
    expect(sessionRecord.completedAt).toBeInstanceOf(Date);

    // Kiểm tra bản ghi session_competency_evaluation
    const reportKey = `${mockSessionId}:session_competency_evaluation:1`;
    const savedReport = sessionReportsMap.get(reportKey);
    expect(savedReport).toBeDefined();
    expect(savedReport.reportType).toBe('session_competency_evaluation');

    const content = savedReport.contentJson;
    expect(content.summary.overallScore).toBe(40);
    // Điểm 40 và chỉ có 1/4 kỹ năng đạt chuẩn -> Khuyến nghị không tuyển
    expect(content.summary.recommendationStatus).toBe('not_recommended');
    expect(content.summary.targetSfiaLevel).toBe(4);
    expect(content.skillsBreakdown).toHaveLength(4);

    // Đối soát chi tiết từng kỹ năng trong breakdown
    const progBreakdown = content.skillsBreakdown.find(
      (s: any) => s.skillCode === 'PROG',
    );
    expect(progBreakdown.demonstratedLevel).toBe(4);
    expect(progBreakdown.targetLevel).toBe(4);
    expect(progBreakdown.status).toBe('passed');

    const dbdsBreakdown = content.skillsBreakdown.find(
      (s: any) => s.skillCode === 'DBDS',
    );
    expect(dbdsBreakdown.demonstratedLevel).toBe(3);
    expect(dbdsBreakdown.status).toBe('gap');

    const archBreakdown = content.skillsBreakdown.find(
      (s: any) => s.skillCode === 'ARCH',
    );
    expect(archBreakdown.demonstratedLevel).toBe(2);
    expect(archBreakdown.status).toBe('gap');

    const desnBreakdown = content.skillsBreakdown.find(
      (s: any) => s.skillCode === 'DESN',
    );
    expect(desnBreakdown.demonstratedLevel).toBe(1);
    expect(desnBreakdown.status).toBe('gap');

    // Kiểm tra bản ghi tương thích ngược executive_summary & action_plan
    const execReport = sessionReportsMap.get(`${mockSessionId}:executive_summary:1`);
    expect(execReport).toBeDefined();
    expect(execReport.contentJson.overallScore).toBe(40);

    const actionReport = sessionReportsMap.get(`${mockSessionId}:action_plan:1`);
    expect(actionReport).toBeDefined();
    expect(actionReport.contentJson.actionPlan).toHaveLength(2);

    // ------------------------------------------------------------------------
    // BƯỚC 4: KIỂM TRA TẦNG TRUY VẤN BÁO CÁO QUA ReportService.getReport
    // ------------------------------------------------------------------------
    const fullReportDto = await reportService.getReport(mockSessionId, mockUserId);
    expect(fullReportDto).toBeDefined();
    expect(fullReportDto.overallScore).toBe(40);
    expect((fullReportDto.executiveSummary as any).recommendationStatus).toBe('not_recommended');
    expect((fullReportDto.competencyHeatmap as any).skillsBreakdown).toHaveLength(4);
    expect((fullReportDto.actionPlan as any).actionPlan).toHaveLength(2);
  });
});
