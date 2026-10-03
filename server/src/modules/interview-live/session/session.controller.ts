import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRole } from '@prisma/client';
import { Roles, CurrentUser } from '@core/common/decorators';
import { SseTokenGuard } from '@core/common/guards';
import type { AuthenticatedUserPayload } from '@core/common/guards/auth-token-verifier.interface';
import { SessionService } from './session.service';
import { SseService } from '@infra/realtime/redis/sse.service';
import { AssessmentFacade } from '@modules/interview-assessment/contracts';
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

function extractUser(userOrReq: unknown): AuthenticatedUserPayload {
  if (typeof userOrReq === 'string') {
    return {
      id: userOrReq,
      email: '',
      role: UserRole.candidate,
      emailVerified: false,
    };
  }

  if (typeof userOrReq === 'object' && userOrReq !== null) {
    const candidate = userOrReq as Record<string, unknown>;
    const nestedUser =
      typeof candidate.user === 'object' && candidate.user !== null
        ? (candidate.user as Record<string, unknown>)
        : candidate;

    return {
      id: typeof nestedUser.id === 'string' ? nestedUser.id : '',
      email: typeof nestedUser.email === 'string' ? nestedUser.email : '',
      role:
        nestedUser.role === UserRole.admin
          ? UserRole.admin
          : UserRole.candidate,
      emailVerified:
        typeof nestedUser.emailVerified === 'boolean'
          ? nestedUser.emailVerified
          : false,
    };
  }

  return {
    id: '',
    email: '',
    role: UserRole.candidate,
    emailVerified: false,
  };
}

@Controller('sessions')
@Roles(UserRole.candidate)
@ApiTags('Sessions')
@ApiCookieAuth('cookieAuth')
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly sseService: SseService,
    private readonly assessmentFacade: AssessmentFacade,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create an interview session and queue question generation',
  })
  @ApiCreatedResponse({ description: 'Session created.' })
  @ApiCommonErrors(400, 401, 429, 503)
  async create(@Body() dto: CreateSessionDto, @CurrentUser() userOrReq: any) {
    const user = extractUser(userOrReq);
    return this.sessionService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List the current user sessions' })
  @ApiOkResponse({ description: 'Sessions.' })
  @ApiCommonErrors(401)
  async findAll(@CurrentUser() userOrReq: any) {
    const user = extractUser(userOrReq);
    return {
      sessions: await this.sessionService.findAll(user.id, user.emailVerified),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an interview session' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Session.' })
  @ApiCommonErrors(401, 403, 404)
  async findOne(@Param('id') id: string, @CurrentUser() userOrReq: any) {
    const user = extractUser(userOrReq);
    return this.sessionService.findById(id, user.id, user.emailVerified);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get question-generation status' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Session status and question count.' })
  @ApiCommonErrors(401, 403, 404)
  async getStatus(@Param('id') id: string, @CurrentUser() userOrReq: any) {
    const user = extractUser(userOrReq);
    const session = await this.sessionService.findById(
      id,
      user.id,
      user.emailVerified,
    );
    return { status: session.status, numQuestions: session.numQuestions };
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get generated session questions' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Questions.' })
  @ApiCommonErrors(401, 403, 404)
  async findQuestions(@Param('id') id: string, @CurrentUser() userOrReq: any) {
    const user = extractUser(userOrReq);
    await this.sessionService.findById(id, user.id, user.emailVerified);
    return this.sessionService.findQuestions(id, user.id);
  }

  @Get(':id/feedback-progress')
  @ApiOperation({ summary: 'Get asynchronous feedback progress' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Feedback progress.' })
  @ApiCommonErrors(401, 403, 404)
  async getFeedbackProgress(
    @Param('id') id: string,
    @CurrentUser() userOrReq: any,
  ) {
    const user = extractUser(userOrReq);
    await this.sessionService.findById(id, user.id, user.emailVerified);
    return this.assessmentFacade.getFeedbackProgress(id, user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update interview session status' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Updated session.' })
  @ApiCommonErrors(400, 401, 403, 404, 409)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSessionStatusDto,
    @CurrentUser() userOrReq: any,
  ) {
    const user = extractUser(userOrReq);
    return this.sessionService.updateStatus(
      id,
      user.id,
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
    @CurrentUser() userOrReq: any,
  ): Promise<Observable<MessageEvent>> {
    const user = extractUser(userOrReq);
    await this.sessionService.findById(id, user.id);
    return this.sseService.subscribe(`sse:session:${id}`);
  }
}
