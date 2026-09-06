import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { UserAccountResponseDto } from './dto/user-account-response.dto';
import { UpdateUserAccountDto } from './dto/update-user-account.dto';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '@core/common/swagger/api-error-responses.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@ApiCookieAuth('cookieAuth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user account' })
  @ApiOkResponse({
    description: 'Current user account details.',
    type: UserAccountResponseDto,
  })
  @ApiCommonErrors(401, 404)
  async getMe(@Req() req: { user: { id: string } }) {
    return this.userService.getAccount(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user account details' })
  @ApiOkResponse({
    description: 'Updated user account details.',
    type: UserAccountResponseDto,
  })
  @ApiCommonErrors(400, 401, 404)
  async updateMe(
    @Body() dto: UpdateUserAccountDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.userService.updateAccount(req.user.id, dto);
  }
}
