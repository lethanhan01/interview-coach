import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiCommonErrors } from '@core/common/swagger/api-error-responses.decorator';
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
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register and start a cookie-authenticated session',
  })
  @ApiCreatedResponse({
    description: 'Account created; authentication cookie is set.',
  })
  @ApiCommonErrors(HttpStatus.BAD_REQUEST, HttpStatus.CONFLICT)
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(
      body.email,
      body.password,
      body.firstname,
      body.lastname,
    );
    this.setCookie(response, result.token);
    return { success: true, data: this.publicUser(result.user) };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in and set the authentication cookie' })
  @ApiOkResponse({
    description: 'Authenticated user; authentication cookie is set.',
  })
  @ApiCommonErrors(HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(body.email, body.password);
    this.setCookie(response, result.token);
    return { success: true, data: this.publicUser(result.user) };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('cookieAuth')
  @ApiOperation({ summary: 'Clear the authentication cookie' })
  @ApiNoContentResponse({ description: 'Cookie cleared.' })
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(
      this.authService.getCookieName(),
      this.cookieOptions(),
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('cookieAuth')
  @ApiOperation({ summary: 'Get the current user' })
  @ApiOkResponse({ description: 'Current authenticated user.' })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED)
  async me(@Req() req: { user: { id: string } }) {
    const user = await this.authService.getMe(req.user.id);
    return { success: true, data: user && this.publicUser(user) };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('cookieAuth')
  @ApiOperation({
    summary: 'Change password and rotate the authentication cookie',
  })
  @ApiOkResponse({
    description: 'Updated user; authentication cookie is refreshed.',
  })
  @ApiCommonErrors(HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED)
  async changePassword(
    @Req() req: { user: { id: string } },
    @Body() body: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
    this.setCookie(response, result.token);
    return { success: true, data: this.publicUser(result.user) };
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Request a password-reset code' })
  @ApiNoContentResponse({ description: 'Request accepted.' })
  @ApiCommonErrors(HttpStatus.BAD_REQUEST)
  async requestPasswordReset(
    @Body() body: PasswordResetRequestDto,
  ): Promise<void> {
    await this.authService.requestPasswordReset(body.email);
  }

  @Post('password-reset/confirm')
  @ApiOperation({ summary: 'Confirm password reset and set a new cookie' })
  @ApiOkResponse({
    description: 'Password reset; authentication cookie is set.',
  })
  @ApiCommonErrors(HttpStatus.BAD_REQUEST)
  async confirmPasswordReset(
    @Body() body: PasswordResetConfirmDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.resetPassword(
      body.email,
      body.code,
      body.newPassword,
    );
    this.setCookie(response, result.token);
    return { success: true, data: this.publicUser(result.user) };
  }

  private setCookie(response: Response, token: string): void {
    response.cookie(
      this.authService.getCookieName(),
      token,
      this.cookieOptions(),
    );
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      maxAge: this.authService.getCookieMaxAge() * 1000,
      path: '/',
    };
  }

  private publicUser(user: {
    id: string;
    email: string;
    role: string;
    status: string;
    firstname: string | null;
    lastname: string | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      firstname: user.firstname,
      lastname: user.lastname,
    };
  }
}
