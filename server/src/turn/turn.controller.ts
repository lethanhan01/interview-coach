import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TurnService } from './turn.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { TurnResponseDto } from './dto/turn-response.dto';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

@Controller('sessions/:sessionId/turns')
@UseGuards(JwtAuthGuard)
export class TurnController {
  constructor(private readonly turnService: TurnService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submitAnswer(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitAnswerDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<TurnResponseDto> {
    return this.turnService.submitAnswer(sessionId, req.user.id, dto);
  }
}
