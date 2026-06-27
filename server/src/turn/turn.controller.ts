import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TurnService } from './turn.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { TurnResponseDto } from './dto/turn-response.dto';
import { AudioUploadResult, UploadedAudioFile } from './audio-storage.service';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

@Controller('sessions/:sessionId/turns')
@UseGuards(JwtAuthGuard)
export class TurnController {
  constructor(private readonly turnService: TurnService) {}

  @Post('audio')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async uploadAudio(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: UploadedAudioFile | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<AudioUploadResult> {
    return this.turnService.uploadAudio(sessionId, req.user.id, file);
  }

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
