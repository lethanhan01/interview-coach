import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  ChangePasswordDto,
  LoginDto,
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
  RegisterDto,
} from './dto/local-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.register(body.email, body.password, body.fullName);
    this.setCookie(response, result.token);
    return { success: true, data: this.publicUser(result.user) };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(body.email, body.password);
    this.setCookie(response, result.token);
    return { success: true, data: this.publicUser(result.user) };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(this.authService.getCookieName(), this.cookieOptions());
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: { user: { id: string } }) {
    const user = await this.authService.getMe(req.user.id);
    return { success: true, data: user && this.publicUser(user) };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req: { user: { id: string } },
    @Body() body: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
    this.setCookie(response, result.token);
    return { success: true, data: this.publicUser(result.user) };
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestPasswordReset(@Body() body: PasswordResetRequestDto): Promise<void> {
    await this.authService.requestPasswordReset(body.email);
  }

  @Post('password-reset/confirm')
  async confirmPasswordReset(
    @Body() body: PasswordResetConfirmDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.resetPassword(body.token, body.newPassword);
    this.setCookie(response, result.token);
    return { success: true, data: this.publicUser(result.user) };
  }

  private setCookie(response: Response, token: string): void {
    response.cookie(this.authService.getCookieName(), token, this.cookieOptions());
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: this.authService.getCookieMaxAge() * 1000,
      path: '/',
    };
  }

  private publicUser(user: { id: string; email: string; role: string; status: string }) {
    return { id: user.id, email: user.email, role: user.role, status: user.status };
  }
}
