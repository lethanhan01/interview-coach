import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportService } from './report.service';
import { ReportResponseDto } from './dto/report-response.dto';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '../common/swagger/api-error-responses.decorator';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; emailVerified: boolean };
}

@Controller('sessions/:sessionId/report')
@UseGuards(JwtAuthGuard)
@ApiTags('Reports')
@ApiCookieAuth('cookieAuth')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  @ApiOperation({ summary: 'Get the completed interview report' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiOkResponse({ type: ReportResponseDto })
  @ApiCommonErrors(401, 403, 404, 202)
  async getReport(
    @Param('sessionId') sessionId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ReportResponseDto> {
    return this.reportService.getReport(
      sessionId,
      req.user.id,
      req.user.emailVerified,
    );
  }
}
