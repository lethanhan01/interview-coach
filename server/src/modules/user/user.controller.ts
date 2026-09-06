import { Controller, Get, Patch, Body } from '@nestjs/common';
import { CurrentUser } from '@core/common/decorators';
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
  async getMe(@CurrentUser() user: { id: string }) {
    const userId = (user as any)?.id ?? (user as any)?.user?.id;
    return this.userService.getAccount(userId);
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
    @CurrentUser() user: { id: string },
  ) {
    const userId = (user as any)?.id ?? (user as any)?.user?.id;
    return this.userService.updateAccount(userId, dto);
  }
}
