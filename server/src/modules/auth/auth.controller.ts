import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiCommonErrors } from '@core/common/swagger/api-error-responses.decorator';
import { Public, CurrentUser } from '@core/common/decorators';
import type { AuthenticatedUserPayload } from '@core/common/guards/auth-token-verifier.interface';
import { AuthService, type DualTokens } from './auth.service';
import {
  ChangePasswordDto,
  LoginDto,
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
  RegisterDto,
  VerifyEmailConfirmDto,
} from './dto/local-auth.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Register and start a cookie-authenticated session',
  })
  @ApiCreatedResponse({
    description: 'Account created; authentication cookies are set.',
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
    this.setCookies(response, result.tokens);
    return { success: true, data: this.publicUser(result.user) };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Log in and set authentication cookies' })
  @ApiOkResponse({
    description: 'Authenticated user; authentication cookies are set.',
  })
  @ApiCommonErrors(HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(body.email, body.password);
    this.setCookies(response, result.tokens);
    return { success: true, data: this.publicUser(result.user) };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate and refresh access token via refresh cookie' })
  @ApiOkResponse({
    description: 'Refreshed session; new authentication cookies are set.',
  })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken =
      req.cookies?.[this.authService.getRefreshCookieName()];
    try {
      const result = await this.authService.refreshSession(refreshToken);
      this.setCookies(response, result.tokens);
      return { success: true, data: this.publicUser(result.user) };
    } catch (error) {
      this.clearCookies(response);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('cookieAuth')
  @ApiOperation({ summary: 'Clear the authentication cookies and revoke refresh token' })
  @ApiNoContentResponse({ description: 'Cookies cleared and session revoked.' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const refreshToken =
      req.cookies?.[this.authService.getRefreshCookieName()];
    await this.authService.logout(refreshToken);
    this.clearCookies(response);
  }

  @Get('me')
  @ApiCookieAuth('cookieAuth')
  @ApiOperation({ summary: 'Get the current user' })
  @ApiOkResponse({ description: 'Current authenticated user.' })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED)
  async me(@CurrentUser() userOrReq: any) {
    const userId = userOrReq?.user?.id ?? userOrReq?.id ?? userOrReq;
    const dbUser = await this.authService.getMe(userId);
    return { success: true, data: dbUser && this.publicUser(dbUser) };
  }

  @Post('change-password')
  @ApiCookieAuth('cookieAuth')
  @ApiOperation({
    summary: 'Change password and rotate the authentication cookies',
  })
  @ApiOkResponse({
    description: 'Updated user; authentication cookies are refreshed.',
  })
  @ApiCommonErrors(HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED)
  async changePassword(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() body: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
    );
    this.setCookies(response, result.tokens);
    return { success: true, data: this.publicUser(result.user) };
  }

  @Public()
  @Post('password-reset/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Request a password-reset code' })
  @ApiNoContentResponse({ description: 'Request accepted.' })
  @ApiCommonErrors(HttpStatus.BAD_REQUEST)
  async requestPasswordReset(
    @Body() body: PasswordResetRequestDto,
  ): Promise<void> {
    await this.authService.requestPasswordReset(body.email);
  }

  @Public()
  @Post('password-reset/confirm')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Confirm password reset and set new cookies' })
  @ApiOkResponse({
    description: 'Password reset; authentication cookies are set.',
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
    this.setCookies(response, result.tokens);
    return { success: true, data: this.publicUser(result.user) };
  }

  @Post('email-verification/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiCookieAuth('cookieAuth')
  @ApiOperation({ summary: 'Request an email verification OTP code' })
  @ApiNoContentResponse({ description: 'Verification OTP sent.' })
  @ApiCommonErrors(HttpStatus.UNAUTHORIZED)
  async requestEmailVerification(
    @CurrentUser() user: AuthenticatedUserPayload,
  ): Promise<void> {
    await this.authService.requestEmailVerification(user.id);
  }

  @Post('email-verification/confirm')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiCookieAuth('cookieAuth')
  @ApiOperation({ summary: 'Confirm email verification OTP' })
  @ApiOkResponse({
    description: 'Email verified; updated user returned.',
  })
  @ApiCommonErrors(HttpStatus.BAD_REQUEST, HttpStatus.UNAUTHORIZED)
  async confirmEmailVerification(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() body: VerifyEmailConfirmDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.confirmEmailVerification(
      user.id,
      body.code,
    );
    this.setCookies(response, result.tokens);
    return { success: true, data: this.publicUser(result.user) };
  }

  private setCookies(response: Response, tokens: DualTokens): void {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    // Access Token Cookie (15 min)
    response.cookie(this.authService.getAccessCookieName(), tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: this.authService.getAccessCookieMaxAge() * 1000,
      path: '/',
    });

    // Refresh Token Cookie (7 days)
    response.cookie(
      this.authService.getRefreshCookieName(),
      tokens.refreshToken,
      {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: this.authService.getRefreshCookieMaxAge() * 1000,
        path: '/',
      },
    );
  }

  private clearCookies(response: Response): void {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const baseOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };

    response.clearCookie(this.authService.getAccessCookieName(), baseOptions);
    response.clearCookie(this.authService.getRefreshCookieName(), baseOptions);
  }

  private publicUser(user: {
    id: string;
    email: string;
    role: string;
    status: string;
    firstname: string | null;
    lastname: string | null;
    emailVerified?: boolean;
  }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      firstname: user.firstname,
      lastname: user.lastname,
      emailVerified: user.emailVerified ?? false,
    };
  }
}
