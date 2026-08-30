import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '@core/common/swagger/api-error-responses.decorator';

@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiTags('Profile')
@ApiCookieAuth('cookieAuth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiOkResponse({
    description: 'Public user profile.',
    type: ProfileResponseDto,
  })
  @ApiCommonErrors(401, 404)
  async getProfile(@Req() req: { user: { id: string } }) {
    return this.userService.getProfile(req.user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Create or update the current user profile' })
  @ApiOkResponse({
    description: 'Updated public user profile.',
    type: ProfileResponseDto,
  })
  @ApiCommonErrors(400, 401)
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.userService.upsertProfile(req.user.id, dto);
  }
}
