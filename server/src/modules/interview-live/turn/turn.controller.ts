import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@core/common/enums';
import { Roles, CurrentUser, Idempotent } from '@core/common/decorators';
import { TurnService } from './turn.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { TurnResponseDto } from './dto/turn-response.dto';
import {
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

  @Post()
  @Idempotent({ ttlSeconds: 86400 })
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
