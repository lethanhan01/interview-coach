import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getProfile(@Req() req: { user: { id: string } }) {
    return this.userService.getProfile(req.user.id);
  }

  @Patch()
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.userService.upsertProfile(req.user.id, dto);
  }
}
