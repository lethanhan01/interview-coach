import { Controller, Get, Param } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles, CurrentUser } from '@core/common/decorators';
import type { AuthenticatedUserPayload } from '@core/common/guards/auth-token-verifier.interface';
import { ReportService } from './report.service';
import { ReportResponseDto } from './dto/report-response.dto';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '@core/common/swagger/api-error-responses.decorator';

@Controller('sessions/:sessionId/report')
@Roles(UserRole.candidate)
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
    @CurrentUser() userOrReq: AuthenticatedUserPayload | { user: AuthenticatedUserPayload },
  ): Promise<ReportResponseDto> {
    const user = (userOrReq as { user?: AuthenticatedUserPayload })?.user ?? (userOrReq as AuthenticatedUserPayload);
    return this.reportService.getReport(
      sessionId,
      user.id,
      user.emailVerified,
    );
  }
}
