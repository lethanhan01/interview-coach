import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { createMockReportService } from '@core/test-utils/mock-factories';

describe('ReportController', () => {
  let controller: ReportController;
  let mockReportService: ReturnType<typeof createMockReportService>;

  beforeEach(async () => {
    mockReportService = createMockReportService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [{ provide: ReportService, useValue: mockReportService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReportController>(ReportController);
  });

  afterEach(() => jest.clearAllMocks());

  describe('GET /sessions/:sessionId/report', () => {
    it('trả về report khi tìm thấy', async () => {
      const mockReport = {
        sessionId: 'session-123',
        overallScore: 82,
        executiveSummary: 'Tốt',
      };
      mockReportService.getReport.mockResolvedValue(mockReport);

      const req = { user: { id: 'user-123', email: 'a@b.com' } } as any;
      const result = await controller.getReport('session-123', req);

      expect(result).toEqual(mockReport);
      expect(mockReportService.getReport).toHaveBeenCalledWith(
        'session-123',
        'user-123',
        undefined,
      );
    });

    it('ném REPORT_NOT_READY khi report chưa sẵn sàng', async () => {
      mockReportService.getReport.mockRejectedValue(
        new InterviewAIException(
          ErrorCode.REPORT_NOT_READY,
          HttpStatus.NOT_FOUND,
        ),
      );

      const req = { user: { id: 'user-123', email: 'a@b.com' } } as any;

      await expect(controller.getReport('session-123', req)).rejects.toThrow(
        InterviewAIException,
      );
    });
  });
});
