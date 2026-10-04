import {
  Controller,
  Post,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { Roles, CurrentUser } from '@core/common/decorators';
import { TurnService } from './turn.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { TurnResponseDto } from './dto/turn-response.dto';
import type {
  UploadedAudioFile,
  AudioUploadResult,
} from '@modules/media/contracts';
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

type RequestUser = string | { id: string } | { user: { id: string } };

function resolveUserId(userOrReq: RequestUser): string {
  if (typeof userOrReq === 'string') {
    return userOrReq;
  }
  if ('id' in userOrReq && typeof userOrReq.id === 'string') {
    return userOrReq.id;
  }
  if (
    'user' in userOrReq &&
    userOrReq.user &&
    typeof userOrReq.user.id === 'string'
  ) {
    return userOrReq.user.id;
  }
  return '';
}

@Controller('sessions/:sessionId/turns')
@Roles(UserRole.candidate)
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
    @CurrentUser() userOrReq: RequestUser,
  ): Promise<AudioUploadResult> {
    const userId = resolveUserId(userOrReq);
    return this.turnService.uploadAudio(sessionId, userId, file);
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
    @CurrentUser() userOrReq: RequestUser,
  ): Promise<TurnResponseDto> {
    const userId = resolveUserId(userOrReq);
    return this.turnService.submitAnswer(sessionId, userId, dto);
  }
}
