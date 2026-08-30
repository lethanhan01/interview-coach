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
import type { UploadedAudioFile } from '../interview/audio-object-storage.service';
import type { AudioUploadResult } from '../interview/upload-and-transcribe-answer-audio.service';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '@core/common/swagger/api-error-responses.decorator';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

@Controller('sessions/:sessionId/turns')
@UseGuards(JwtAuthGuard)
@ApiTags('Turns')
@ApiCookieAuth('cookieAuth')
export class TurnController {
  constructor(private readonly turnService: TurnService) {}

  @Post('audio')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ApiOperation({ summary: 'Upload answer audio (maximum 10 MB)' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Audio file, maximum 10 MB.',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Uploaded audio metadata.' })
  @ApiCommonErrors(400, 401, 403, 404, 413, 415, 503)
  async uploadAudio(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: UploadedAudioFile | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<AudioUploadResult> {
    return this.turnService.uploadAudio(sessionId, req.user.id, file);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a text or voice answer' })
  @ApiParam({ name: 'sessionId', format: 'uuid' })
  @ApiCreatedResponse({ type: TurnResponseDto })
  @ApiCommonErrors(400, 401, 403, 404, 409, 503)
  async submitAnswer(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitAnswerDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<TurnResponseDto> {
    return this.turnService.submitAnswer(sessionId, req.user.id, dto);
  }
}
