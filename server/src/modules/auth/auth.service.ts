import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus, UserRole, type User } from '@prisma/client';
import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import nodemailer from 'nodemailer';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import {
  type AuthTokenVerifier,
  type AuthenticatedUserPayload,
} from '@core/common/guards/auth-token-verifier.interface';
import { hashPassword, verifyPassword } from './password';

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;
const PASSWORD_RESET_PURPOSE = 'password_reset_otp';
const EMAIL_VERIFICATION_PURPOSE = 'email_verification_otp';
const MAX_OTP_ATTEMPTS = 5;

export interface DualTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService implements AuthTokenVerifier {
  private readonly accessCookieName: string;
  private readonly refreshCookieName: string;
  private readonly accessCookieMaxAge: number;
  private readonly refreshCookieMaxAge: number;
  private readonly otpTtlMs: number;
  private readonly authSecret: string;
  private readonly smtpFrom: string;
  private readonly mailer: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    config: ConfigService,
  ) {
    this.accessCookieName =
      config.get<string>('AUTH_ACCESS_COOKIE_NAME') ??
      config.get<string>('AUTH_COOKIE_NAME') ??
      'interviewcoach_access';
    this.refreshCookieName =
      config.get<string>('AUTH_REFRESH_COOKIE_NAME') ?? 'interviewcoach_refresh';
    this.accessCookieMaxAge =
      config.get<number>('AUTH_ACCESS_COOKIE_MAX_AGE') ?? 900; // 15 minutes
    this.refreshCookieMaxAge =
      config.get<number>('AUTH_REFRESH_COOKIE_MAX_AGE') ?? 604_800; // 7 days
    this.otpTtlMs =
      (config.get<number>('PASSWORD_RESET_OTP_TTL_MINUTES') ?? 15) * 60 * 1000;
    this.authSecret = config.getOrThrow<string>('AUTH_JWT_SECRET');
    this.smtpFrom =
      config.get<string>('SMTP_FROM') ?? 'noreply@interviewcoach.com';
    this.mailer = nodemailer.createTransport({
      host: config.getOrThrow<string>('SMTP_HOST'),
      port: config.getOrThrow<number>('SMTP_PORT'),
      secure: config.get<number>('SMTP_PORT') === 465,
      auth: {
        user: config.getOrThrow<string>('SMTP_USER'),
        pass: config.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });
  }

  getAccessCookieName(): string {
    return this.accessCookieName;
  }

  getRefreshCookieName(): string {
    return this.refreshCookieName;
  }

  getAccessCookieMaxAge(): number {
    return this.accessCookieMaxAge;
  }

  getRefreshCookieMaxAge(): number {
    return this.refreshCookieMaxAge;
  }

  async verifySessionToken(token: string): Promise<AuthenticatedUserPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        tokenVersion: number;
      }>(token);
      if (!payload?.sub || !Number.isInteger(payload.tokenVersion)) {
        throw new Error('Invalid token');
      }
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (
        !user ||
        user.status !== AccountStatus.active ||
        user.tokenVersion !== payload.tokenVersion
      ) {
        throw new Error('Invalid account or session expired');
      }
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      };
    } catch {
      throw new InterviewAIException(
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        'Invalid or expired session',
      );
    }
  }

  async register(
    email: string,
    password: string,
    firstname: string,
    lastname: string,
  ): Promise<{ user: User; tokens: DualTokens }> {
    const normalizedEmail = this.normalizeEmail(email);
    this.assertPassword(password);
    const passwordHash = await hashPassword(password);

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            id: randomUUID(),
            email: normalizedEmail,
            passwordHash,
            firstname,
            lastname,
            role: UserRole.candidate,
            status: AccountStatus.active,
            emailVerified: false,
          },
        });
        await tx.userProfile.create({ data: { userId: created.id } });
        return created;
      });

      const tokens = await this.signTokens(user);

      // Trigger email verification OTP asynchronously
      this.requestEmailVerification(user.id).catch(() => undefined);

      return { user, tokens };
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new InterviewAIException(
          ErrorCode.EMAIL_ALREADY_EXISTS,
          HttpStatus.CONFLICT,
          'Email is already registered',
        );
      }
      throw error;
    }
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; tokens: DualTokens }> {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });
    if (
      !user ||
      !user.passwordHash ||
      !(await verifyPassword(password, user.passwordHash))
    ) {
      throw new InterviewAIException(
        ErrorCode.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
        'Invalid email or password',
      );
    }
    if (user.status !== AccountStatus.active) {
      throw new InterviewAIException(
        ErrorCode.ACCOUNT_INACTIVE,
        HttpStatus.UNAUTHORIZED,
        'This account is not active',
      );
    }
    const tokens = await this.signTokens(user);
    return { user, tokens };
  }

  async refreshSession(
    refreshTokenRaw: string | undefined,
  ): Promise<{ user: User; tokens: DualTokens }> {
    if (!refreshTokenRaw) {
      throw new InterviewAIException(
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        'Refresh token is required',
      );
    }

    const tokenHash = this.hashToken(refreshTokenRaw);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new InterviewAIException(
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        'Invalid refresh session',
      );
    }

    // Token Reuse Detection: If this token was already revoked, revoke all tokens for this user!
    if (storedToken.revokedAt !== null) {
      await this.prisma.user.update({
        where: { id: storedToken.userId },
        data: { tokenVersion: { increment: 1 } },
      });
      await this.prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revokedAt: new Date() },
      });
      throw new InterviewAIException(
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        'Compromised refresh token detected. All sessions revoked.',
      );
    }

    if (storedToken.expiresAt <= new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
      throw new InterviewAIException(
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        'Refresh session has expired. Please log in again.',
      );
    }

    if (storedToken.user.status !== AccountStatus.active) {
      throw new InterviewAIException(
        ErrorCode.ACCOUNT_INACTIVE,
        HttpStatus.UNAUTHORIZED,
        'This account is not active',
      );
    }

    // Token Rotation: revoke old token and issue new token pair
    const tokens = await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
      return this.signTokens(storedToken.user, tx);
    });

    return { user: storedToken.user, tokens };
  }

  async logout(refreshTokenRaw?: string): Promise<void> {
    if (refreshTokenRaw) {
      const tokenHash = this.hashToken(refreshTokenRaw);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ user: User; tokens: DualTokens }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      !user?.passwordHash ||
      !(await verifyPassword(currentPassword, user.passwordHash))
    ) {
      throw new InterviewAIException(
        ErrorCode.INVALID_CREDENTIALS,
        HttpStatus.UNAUTHORIZED,
        'Current password is incorrect',
      );
    }
    this.assertPassword(newPassword);

    const updated = await this.prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await hashPassword(newPassword),
          tokenVersion: { increment: 1 },
        },
      });
      // Revoke all existing refresh tokens for this user
      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return nextUser;
    });

    const tokens = await this.signTokens(updated);
    return { user: updated, tokens };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });
    if (
      !user ||
      user.status === AccountStatus.deleted ||
      user.status === AccountStatus.locked
    ) {
      return;
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.prisma.userVerificationCode.upsert({
      where: {
        userId_purpose: { userId: user.id, purpose: PASSWORD_RESET_PURPOSE },
      },
      create: {
        userId: user.id,
        purpose: PASSWORD_RESET_PURPOSE,
        codeHash: this.hashVerificationCode(user.id, code, PASSWORD_RESET_PURPOSE),
        attempts: 0,
        expiresAt: new Date(Date.now() + this.otpTtlMs),
      },
      update: {
        codeHash: this.hashVerificationCode(user.id, code, PASSWORD_RESET_PURPOSE),
        attempts: 0,
        expiresAt: new Date(Date.now() + this.otpTtlMs),
      },
    });

    await this.mailer.sendMail({
      from: this.smtpFrom,
      to: user.email,
      subject: 'Mã OTP đặt lại mật khẩu InterviewCoach',
      text: `Mã OTP đặt lại mật khẩu của bạn là: ${code}\nMã có hiệu lực trong ${this.otpTtlMs / 60000} phút. Không chia sẻ mã này với bất kỳ ai.`,
    });
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ user: User; tokens: DualTokens }> {
    this.assertPassword(newPassword);
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || user.status === AccountStatus.deleted) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Invalid or expired reset code',
      );
    }

    if (user.status === AccountStatus.locked) {
      throw new InterviewAIException(
        ErrorCode.ACCOUNT_INACTIVE,
        HttpStatus.UNAUTHORIZED,
        'This account is locked. Please contact support.',
      );
    }

    const verification = await this.prisma.userVerificationCode.findUnique({
      where: {
        userId_purpose: { userId: user.id, purpose: PASSWORD_RESET_PURPOSE },
      },
    });

    if (!verification || verification.expiresAt <= new Date()) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Invalid or expired reset code',
      );
    }

    if (verification.attempts >= MAX_OTP_ATTEMPTS) {
      await this.prisma.userVerificationCode.delete({
        where: { id: verification.id },
      });
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Mã OTP đã bị hủy do nhập sai quá 5 lần. Vui lòng yêu cầu mã mới.',
      );
    }

    const expectedHash = Buffer.from(
      this.hashVerificationCode(user.id, code, PASSWORD_RESET_PURPOSE),
    );
    const actualHash = Buffer.from(verification.codeHash);
    const isMatch =
      expectedHash.length === actualHash.length &&
      timingSafeEqual(expectedHash, actualHash);

    if (!isMatch) {
      const nextAttempts = verification.attempts + 1;
      if (nextAttempts >= MAX_OTP_ATTEMPTS) {
        await this.prisma.userVerificationCode.delete({
          where: { id: verification.id },
        });
        throw new InterviewAIException(
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          'Mã OTP đã bị hủy do nhập sai quá 5 lần. Vui lòng yêu cầu mã mới.',
        );
      }
      await this.prisma.userVerificationCode.update({
        where: { id: verification.id },
        data: { attempts: nextAttempts },
      });
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        `Mã OTP không chính xác. Bạn còn ${MAX_OTP_ATTEMPTS - nextAttempts} lần thử.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await hashPassword(newPassword),
          tokenVersion: { increment: 1 },
        },
      });
      await tx.userVerificationCode.delete({
        where: { id: verification.id },
      });
      await tx.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return nextUser;
    });

    const tokens = await this.signTokens(updated);
    return { user: updated, tokens };
  }

  async requestEmailVerification(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.emailVerified || user.status === AccountStatus.deleted) {
      return;
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.prisma.userVerificationCode.upsert({
      where: {
        userId_purpose: { userId: user.id, purpose: EMAIL_VERIFICATION_PURPOSE },
      },
      create: {
        userId: user.id,
        purpose: EMAIL_VERIFICATION_PURPOSE,
        codeHash: this.hashVerificationCode(user.id, code, EMAIL_VERIFICATION_PURPOSE),
        attempts: 0,
        expiresAt: new Date(Date.now() + this.otpTtlMs),
      },
      update: {
        codeHash: this.hashVerificationCode(user.id, code, EMAIL_VERIFICATION_PURPOSE),
        attempts: 0,
        expiresAt: new Date(Date.now() + this.otpTtlMs),
      },
    });

    await this.mailer.sendMail({
      from: this.smtpFrom,
      to: user.email,
      subject: 'Mã OTP xác thực tài khoản InterviewCoach',
      text: `Mã OTP xác thực email của bạn là: ${code}\nMã có hiệu lực trong ${this.otpTtlMs / 60000} phút.`,
    });
  }

  async confirmEmailVerification(
    userId: string,
    code: string,
  ): Promise<{ user: User; tokens: DualTokens }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status === AccountStatus.deleted) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Invalid user account',
      );
    }

    if (user.emailVerified) {
      const tokens = await this.signTokens(user);
      return { user, tokens };
    }

    const verification = await this.prisma.userVerificationCode.findUnique({
      where: {
        userId_purpose: { userId: user.id, purpose: EMAIL_VERIFICATION_PURPOSE },
      },
    });

    if (!verification || verification.expiresAt <= new Date()) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Invalid or expired verification code',
      );
    }

    if (verification.attempts >= MAX_OTP_ATTEMPTS) {
      await this.prisma.userVerificationCode.delete({
        where: { id: verification.id },
      });
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Mã OTP đã bị hủy do nhập sai quá 5 lần. Vui lòng yêu cầu mã mới.',
      );
    }

    const expectedHash = Buffer.from(
      this.hashVerificationCode(user.id, code, EMAIL_VERIFICATION_PURPOSE),
    );
    const actualHash = Buffer.from(verification.codeHash);
    const isMatch =
      expectedHash.length === actualHash.length &&
      timingSafeEqual(expectedHash, actualHash);

    if (!isMatch) {
      const nextAttempts = verification.attempts + 1;
      if (nextAttempts >= MAX_OTP_ATTEMPTS) {
        await this.prisma.userVerificationCode.delete({
          where: { id: verification.id },
        });
        throw new InterviewAIException(
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          'Mã OTP đã bị hủy do nhập sai quá 5 lần. Vui lòng yêu cầu mã mới.',
        );
      }
      await this.prisma.userVerificationCode.update({
        where: { id: verification.id },
        data: { attempts: nextAttempts },
      });
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        `Mã OTP không chính xác. Bạn còn ${MAX_OTP_ATTEMPTS - nextAttempts} lần thử.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
      await tx.userVerificationCode.delete({
        where: { id: verification.id },
      });
      return nextUser;
    });

    const tokens = await this.signTokens(updated);
    return { user: updated, tokens };
  }

  async getMe(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  private async signTokens(
    user: User,
    prismaTx?: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
  ): Promise<DualTokens> {
    const client = prismaTx ?? this.prisma;
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        tokenVersion: user.tokenVersion,
      },
      { expiresIn: this.accessCookieMaxAge },
    );

    const refreshToken = randomBytes(64).toString('base64url');
    const tokenHash = this.hashToken(refreshToken);

    await client.refreshToken.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + this.refreshCookieMaxAge * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private assertPassword(password: string): void {
    if (
      password.length < PASSWORD_MIN_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH
    ) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`,
      );
    }
  }

  private hashVerificationCode(
    userId: string,
    code: string,
    purpose: string,
  ): string {
    return createHmac('sha256', this.authSecret)
      .update(`${purpose}:${userId}:${code}`)
      .digest('base64url');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
