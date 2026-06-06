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
import { SessionService } from './session.service';
import { SseService } from '../common/services/sse.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionStatusDto } from './dto/update-session-status.dto';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly sseService: SseService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateSessionDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.sessionService.create(req.user.id, dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.sessionService.findById(id, req.user.id);
  }

  @Get(':id/status')
  async getStatus(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    const session = await this.sessionService.findById(id, req.user.id);
    return { status: session.status, numQuestions: session.numQuestions };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSessionStatusDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.sessionService.updateStatus(id, req.user.id, dto.status);
  }

  @Sse(':id/events')
  streamEvents(@Param('id') id: string): Observable<MessageEvent> {
    return this.sseService.subscribe(`sse:session:${id}`);
  }
}
