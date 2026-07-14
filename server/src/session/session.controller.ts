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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SseTokenGuard } from '../auth/guards/sse-token.guard';
import { SessionService } from './session.service';
import { SseService } from '../common/services/sse.service';
import { ReportService } from '../report/report.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionStatusDto } from './dto/update-session-status.dto';

@Controller('sessions')
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly sseService: SseService,
    private readonly reportService: ReportService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreateSessionDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.sessionService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Req() req: { user: { id: string } }) {
    return { sessions: await this.sessionService.findAll(req.user.id) };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.sessionService.findById(id, req.user.id);
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  async getStatus(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    const session = await this.sessionService.findById(id, req.user.id);
    return { status: session.status, numQuestions: session.numQuestions };
  }

  @Get(':id/questions')
  @UseGuards(JwtAuthGuard)
  async findQuestions(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.sessionService.findQuestions(id, req.user.id);
  }

  @Get(':id/feedback-progress')
  @UseGuards(JwtAuthGuard)
  async getFeedbackProgress(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.reportService.getFeedbackProgress(id, req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
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
  streamEvents(@Param('id') id: string): Observable<MessageEvent> {
    return this.sseService.subscribe(`sse:session:${id}`);
  }
}
