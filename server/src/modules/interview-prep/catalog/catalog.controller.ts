import { Controller, Get } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '@core/common/swagger/api-error-responses.decorator';
import { InterviewOptionsCatalogService } from './interview-options-catalog.service';
import type { InterviewOptionsCatalogResponse } from './dto/interview-options-response.dto';

@Controller('catalog')
@ApiTags('Catalog')
@ApiCookieAuth('cookieAuth')
export class CatalogController {
  constructor(
    private readonly interviewOptionsCatalogService: InterviewOptionsCatalogService,
  ) {}

  @Get('interview-options')
  @ApiOperation({
    summary:
      'Get canonical interview configuration and profile catalog options',
  })
  @ApiOkResponse({
    description:
      'Canonical catalog options for JD levels, SFIA levels, durations, session types, context packs, and education degrees',
  })
  @ApiCommonErrors(401)
  async getInterviewOptions(): Promise<InterviewOptionsCatalogResponse> {
    return this.interviewOptionsCatalogService.getInterviewOptions();
  }
}
