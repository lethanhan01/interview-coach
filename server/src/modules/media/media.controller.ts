import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UserRole } from '@core/common/enums';
import { Roles } from '@core/common/decorators';
import {
  ApiTags,
  ApiCookieAuth,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '@core/common/swagger/api-error-responses.decorator';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { MediaFacade } from './contracts/media-facade.service';
import { TranscribeAudioDto } from './dto/transcribe-audio.dto';
import { SynthesizeSpeechDto } from './dto/synthesize-speech.dto';
import { TranscribeResponseDto } from './dto/transcribe-response.dto';

const ALLOWED_MIME_TYPES = new Set([
  'audio/webm',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/ogg',
  'audio/vorbis',
  'audio/mpeg',
  'audio/mp3',
  'video/webm',
]);

const MAX_AUDIO_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

@Controller('media')
@Roles(UserRole.candidate)
@ApiTags('Media')
@ApiCookieAuth('cookieAuth')
@ApiBearerAuth('jwtAuth')
export class MediaController {
  constructor(private readonly mediaFacade: MediaFacade) {}

  @Post('transcribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transcribe audio buffer and extract speech metrics (WPM, pauses, fillers)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({
    type: TranscribeResponseDto,
    description: 'Transcription text, timestamps, and voice metrics',
  })
  @ApiCommonErrors()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_AUDIO_SIZE_BYTES,
      },
    }),
  )
  async transcribe(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: TranscribeAudioDto,
  ): Promise<TranscribeResponseDto> {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Audio file is required',
      );
    }

    const mime = (file.mimetype || '').toLowerCase().split(';')[0].trim();
    if (mime && !ALLOWED_MIME_TYPES.has(mime)) {
      throw new InterviewAIException(
        ErrorCode.UNSUPPORTED_MEDIA_TYPE,
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        `Unsupported audio format (${mime}). Allowed: webm, wav, mp4, ogg, mp3`,
      );
    }

    return this.mediaFacade.transcribeAudio(file, body.language);
  }

  @Post('synthesize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Synthesize speech (TTS) from question text returning audio stream',
  })
  @ApiOkResponse({
    description: 'Chunked audio stream (WAV PCM 24kHz or MP3)',
  })
  @ApiCommonErrors()
  async synthesize(
    @Body() body: SynthesizeSpeechDto,
    @Res() res: Response,
  ): Promise<void> {
    const { stream, contentType } = await this.mediaFacade.synthesizeSpeech(
      body.text,
      body.language,
    );

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Transfer-Encoding', 'chunked');

    stream.pipe(res);
  }
}
