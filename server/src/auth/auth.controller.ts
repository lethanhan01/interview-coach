import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshGuard } from './guards/refresh.guard';
import { AuthenticatedUser } from './dto/authenticated-user.dto';

const COOKIE_NAME = 'refresh_token';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days in seconds

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshGuard)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken } = req.user as { refreshToken: string };
    const result = await this.authService.refreshToken(refreshToken);
    res.cookie(COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE_SECONDS * 1000,
      path: '/auth',
    });
    return {
      success: true,
      data: { accessToken: result.accessToken, expiresIn: result.expiresIn },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as AuthenticatedUser;
    await this.authService.logout(user.id);
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      path: '/auth',
    });
  }
}
