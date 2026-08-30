import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { SseTokenGuard } from '../../../auth/guards/sse-token.guard';
import { SessionService } from './session.service';
import { SseService } from '@infra/realtime/redis/sse.service';
import { ReportService } from '@modules/interview-assessment/report/report.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionStatusDto } from './dto/update-session-status.dto';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '@core/common/swagger/api-error-responses.decorator';

@Controller('sessions')
@ApiTags('Sessions')
@ApiCookieAuth('cookieAuth')
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly sseService: SseService,
    private readonly reportService: ReportService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Create an interview session and queue question generation',
  })
  @ApiCreatedResponse({ description: 'Session created.' })
  @ApiCommonErrors(400, 401, 429, 503)
  async create(
    @Body() dto: CreateSessionDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.sessionService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List the current user sessions' })
  @ApiOkResponse({ description: 'Sessions.' })
  @ApiCommonErrors(401)
  async findAll(@Req() req: { user: { id: string; emailVerified: boolean } }) {
    return {
      sessions: await this.sessionService.findAll(
        req.user.id,
        req.user.emailVerified,
      ),
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get an interview session' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Session.' })
  @ApiCommonErrors(401, 403, 404)
  async findOne(
    @Param('id') id: string,
    @Req() req: { user: { id: string; emailVerified: boolean } },
  ) {
    return this.sessionService.findById(
      id,
      req.user.id,
      req.user.emailVerified,
    );
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get question-generation status' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Session status and question count.' })
  @ApiCommonErrors(401, 403, 404)
  async getStatus(
    @Param('id') id: string,
    @Req() req: { user: { id: string; emailVerified: boolean } },
  ) {
    const session = await this.sessionService.findById(
      id,
      req.user.id,
      req.user.emailVerified,
    );
    return { status: session.status, numQuestions: session.numQuestions };
  }

  @Get(':id/questions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get generated session questions' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Questions.' })
  @ApiCommonErrors(401, 403, 404)
  async findQuestions(
    @Param('id') id: string,
    @Req() req: { user: { id: string; emailVerified: boolean } },
  ) {
    await this.sessionService.findById(id, req.user.id, req.user.emailVerified);
    return this.sessionService.findQuestions(id, req.user.id);
  }

  @Get(':id/feedback-progress')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get asynchronous feedback progress' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Feedback progress.' })
  @ApiCommonErrors(401, 403, 404)
  async getFeedbackProgress(
    @Param('id') id: string,
    @Req() req: { user: { id: string; emailVerified: boolean } },
  ) {
    await this.sessionService.findById(id, req.user.id, req.user.emailVerified);
    return this.reportService.getFeedbackProgress(id, req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update interview session status' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Updated session.' })
  @ApiCommonErrors(400, 401, 403, 404, 409)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSessionStatusDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.sessionService.updateStatus(
      id,
      req.user.id,
      dto.status,
      dto.remainingSeconds,
      dto.autoSkipUnanswered,
    );
  }

  @Sse(':id/events')
  @UseGuards(SseTokenGuard)
  @ApiOperation({
    summary: 'Stream session events',
    description:
      'SSE stream. Swagger UI cannot render a continuous event stream; use EventSource or curl to consume it.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiProduces('text/event-stream')
  @ApiCommonErrors(401, 403, 404)
  async streamEvents(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ): Promise<Observable<MessageEvent>> {
    await this.sessionService.findById(id, req.user.id);
    return this.sseService.subscribe(`sse:session:${id}`);
  }
}
