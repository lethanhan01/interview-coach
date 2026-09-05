import { Test, TestingModule } from '@nestjs/testing';
import {
  UnifiedReportGeneratorService,
  UNIFIED_REPORT_TYPE,
} from './unified-report-generator.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { AI_GATEWAY_TOKEN } from '@infra/ai/ai-gateway.interface';
import { SFIA_FACADE_TOKEN } from '@modules/sfia/contracts';

describe('UnifiedReportGeneratorService', () => {
  let service: UnifiedReportGeneratorService;
  let mockPrisma: any;
  let mockAiGateway: any;
  let mockSfiaFacade: any;
  let tx: any;

  beforeEach(async () => {
    tx = {
      sessionReport: {
        upsert: jest.fn().mockResolvedValue({ id: 'report-1' }),
      },
      interviewSession: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    mockPrisma = {
      interviewSession: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(tx)),
    };

    mockAiGateway = {
      chatCompletion: jest.fn(),
    };

    mockSfiaFacade = {
      getSkillByCode: jest.fn().mockImplementation((code) => {
        if (code === 'PROG') return Promise.resolve({ name: 'Software Development' });
        if (code === 'DBDS') return Promise.resolve({ name: 'Database Design' });
        return Promise.resolve(null);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnifiedReportGeneratorService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AI_GATEWAY_TOKEN, useValue: mockAiGateway },
        { provide: SFIA_FACADE_TOKEN, useValue: mockSfiaFacade },
      ],
    }).compile();

    service = module.get<UnifiedReportGeneratorService>(
      UnifiedReportGeneratorService,
    );
  });

  describe('resolveRecommendationStatus', () => {
    it('nên phân loại chính xác các ngưỡng điểm khuyến nghị', () => {
      expect(service.resolveRecommendationStatus(85)).toBe('strongly_recommended');
      expect(service.resolveRecommendationStatus(80)).toBe('strongly_recommended');
      expect(service.resolveRecommendationStatus(75)).toBe('recommended');
      expect(service.resolveRecommendationStatus(65)).toBe('recommended');
      expect(service.resolveRecommendationStatus(60)).toBe('borderline');
      expect(service.resolveRecommendationStatus(50)).toBe('borderline');
      expect(service.resolveRecommendationStatus(45)).toBe('not_recommended');
    });
  });

  describe('generateReport', () => {
    it('nên sinh báo cáo unified hoàn chỉnh với AI khi có đầy đủ dữ liệu', async () => {
      const sessionId = 'session-123';
      const mockSession = {
        id: sessionId,
        targetSfiaLevel: 4,
        overallScore: 78,
        savedJobDescription: {
          jobTitle: 'Senior Full Stack Engineer',
        },
        sessionSkills: [
          {
            id: 'skill-1',
            skillCode: 'PROG',
            techContext: ['Node.js'],
            targetLevel: 4,
            actualLevel: 4,
            score: 90,
            weight: 1.5,
          },
          {
            id: 'skill-2',
            skillCode: 'DBDS',
            techContext: ['PostgreSQL'],
            targetLevel: 4,
            actualLevel: 3,
            score: 55,
            weight: 1.0,
          },
        ],
        sessionQuestions: [
          {
            id: 'q1',
            sessionSkillId: 'skill-1',
            userAnswers: [
              {
                aiFeedback: {
                  strengths: ['Nắm rất vững Node.js Event Loop'],
                  improvements: ['Nên tìm hiểu thêm về Worker Threads'],
                },
              },
            ],
          },
          {
            id: 'q2',
            sessionSkillId: 'skill-2',
            userAnswers: [
              {
                aiFeedback: {
                  strengths: ['Biết viết Index cơ bản'],
                  improvements: ['Chưa hiểu sâu về Locking và Connection Pool'],
                },
              },
            ],
          },
        ],
      };

      mockPrisma.interviewSession.findUnique.mockResolvedValue(mockSession);

      const aiResponse = {
        executive_summary:
          'Ứng viên thể hiện nền tảng lập trình tốt (PROG Level 4). Tuy nhiên phần CSDL cần củng cố thêm về Lock và Pooling.',
        action_plan: [
          {
            priority: 'high',
            skill_code: 'DBDS',
            title: 'Tối ưu hóa PostgreSQL chuyên sâu',
            topics: ['Connection Pooling với PgBouncer', 'Lock Contention Analysis'],
            estimated_weeks: 2,
          },
        ],
      };
      mockAiGateway.chatCompletion.mockResolvedValue(JSON.stringify(aiResponse));

      const report = await service.generateReport(sessionId, 'vi');

      expect(report.summary.overallScore).toBe(78);
      expect(report.summary.recommendationStatus).toBe('recommended');
      expect(report.summary.executiveSummary).toBe(aiResponse.executive_summary);
      expect(report.skillsBreakdown).toHaveLength(2);
      expect(report.skillsBreakdown[0].status).toBe('passed');
      expect(report.skillsBreakdown[0].skillName).toBe('Software Development');
      expect(report.skillsBreakdown[1].status).toBe('gap');
      expect(report.skillsBreakdown[1].skillName).toBe('Database Design');
      expect(report.actionPlan).toHaveLength(1);
      expect(report.actionPlan[0].skillCode).toBe('DBDS');

      // Xác nhận lưu DB trong transaction
      expect(tx.sessionReport.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sessionId_reportType_version: {
              sessionId,
              reportType: UNIFIED_REPORT_TYPE,
              version: 1,
            },
          },
        }),
      );

      // Xác nhận cập nhật session status = completed
      expect(tx.interviewSession.update).toHaveBeenCalledWith({
        where: { id: sessionId },
        data: expect.objectContaining({
          status: 'completed',
          overallScore: 78,
          recommendationStatus: 'recommended',
        }),
      });
    });

    it('nên kích hoạt template tất định fallback khi AI Gateway gặp sự cố', async () => {
      const sessionId = 'session-fallback';
      const mockSession = {
        id: sessionId,
        targetSfiaLevel: 4,
        overallScore: 45,
        savedJobDescription: {
          jobTitle: 'Backend Developer',
        },
        sessionSkills: [
          {
            id: 'skill-1',
            skillCode: 'PROG',
            techContext: ['Go'],
            targetLevel: 4,
            actualLevel: 2,
            score: 45,
            weight: 1.0,
          },
        ],
        sessionQuestions: [],
      };

      mockPrisma.interviewSession.findUnique.mockResolvedValue(mockSession);
      mockAiGateway.chatCompletion.mockRejectedValue(new Error('AI Gateway 503 Overloaded'));

      const report = await service.generateReport(sessionId, 'vi');

      expect(report.summary.overallScore).toBe(45);
      expect(report.summary.recommendationStatus).toBe('not_recommended');
      expect(report.summary.executiveSummary).toContain('Backend Developer');
      expect(report.summary.executiveSummary).toContain('chưa đáp ứng kỳ vọng');
      expect(report.skillsBreakdown[0].status).toBe('gap');
      expect(report.actionPlan.length).toBeGreaterThan(0);
      expect(report.actionPlan[0].skillCode).toBe('PROG');
    });
  });
});
