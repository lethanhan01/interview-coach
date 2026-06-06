import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportService } from './report.service';
import { ReportResponseDto } from './dto/report-response.dto';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

@Controller('sessions/:sessionId/report')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  async getReport(
    @Param('sessionId') sessionId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ReportResponseDto> {
    return this.reportService.getReport(sessionId, req.user.id);
  }
}
