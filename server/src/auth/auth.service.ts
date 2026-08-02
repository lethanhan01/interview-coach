import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus, UserRole, type User } from '@prisma/client';
import { createHmac, randomInt, randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword } from './password';

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;
const PASSWORD_RESET_PURPOSE = 'password_reset_otp';

@Injectable()
export class AuthService {
  private readonly cookieName: string;
  private readonly cookieMaxAge: number;
  private readonly verificationCodeTtlMs: number;
  private readonly authSecret: string;
  private readonly mailer: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    config: ConfigService,
  ) {
    this.cookieName =
      config.get<string>('AUTH_COOKIE_NAME') ?? 'interviewcoach_auth';
    this.cookieMaxAge = config.get<number>('AUTH_COOKIE_MAX_AGE') ?? 86_400;
    this.verificationCodeTtlMs =
      (config.get<number>('PASSWORD_RESET_OTP_TTL_MINUTES') ?? 30) * 60 * 1000;
    this.authSecret = config.getOrThrow<string>('AUTH_JWT_SECRET');
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

  getCookieName(): string {
    return this.cookieName;
  }

  getCookieMaxAge(): number {
    return this.cookieMaxAge;
  }

  async register(
    email: string,
    password: string,
    firstname: string,
    lastname: string,
  ): Promise<{ user: User; token: string }> {
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
          },
        });
        await tx.userProfile.create({ data: { userId: created.id } });
        return created;
      });
      return { user, token: await this.sign(user) };
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('Email is already registered');
      }
      throw error;
    }
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });
    if (
      !user ||
      !user.passwordHash ||
      !(await verifyPassword(password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status !== AccountStatus.active) {
      throw new UnauthorizedException('This account is not active');
    }
    return { user, token: await this.sign(user) };
  }

  async getAuthenticatedUser(token: string): Promise<User> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        tokenVersion: number;
      }>(token);
      if (!payload?.sub || !Number.isInteger(payload.tokenVersion))
        throw new Error('Invalid token');
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (
        !user ||
        user.status !== AccountStatus.active ||
        user.tokenVersion !== payload.tokenVersion
      ) {
        throw new Error('Invalid account');
      }
      return user;
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ user: User; token: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      !user?.passwordHash ||
      !(await verifyPassword(currentPassword, user.passwordHash))
    ) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    this.assertPassword(newPassword);
    const updated = await this.updatePassword(
      user.id,
      newPassword,
      AccountStatus.active,
    );
    return { user: updated, token: await this.sign(updated) };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });
    if (!user || user.status === AccountStatus.deleted) return;
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.prisma.userVerificationCode.upsert({
      where: {
        userId_purpose: { userId: user.id, purpose: PASSWORD_RESET_PURPOSE },
      },
      create: {
        userId: user.id,
        purpose: PASSWORD_RESET_PURPOSE,
        codeHash: this.hashVerificationCode(user.id, code),
        expiresAt: new Date(Date.now() + this.verificationCodeTtlMs),
      },
      update: {
        codeHash: this.hashVerificationCode(user.id, code),
        expiresAt: new Date(Date.now() + this.verificationCodeTtlMs),
      },
    });
    await this.mailer.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Mã OTP đặt lại mật khẩu InterviewCoach',
      text: `Mã OTP của bạn là: ${code}\nMã có hiệu lực trong ${this.verificationCodeTtlMs / 60000} phút.`,
    });
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ user: User; token: string }> {
    this.assertPassword(newPassword);
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user || user.status === AccountStatus.deleted) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const verification = await this.prisma.userVerificationCode.findUnique({
      where: {
        userId_purpose: { userId: user.id, purpose: PASSWORD_RESET_PURPOSE },
      },
    });
    if (
      !verification ||
      verification.expiresAt <= new Date() ||
      verification.codeHash !== this.hashVerificationCode(user.id, code)
    ) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await hashPassword(newPassword),
          status: AccountStatus.active,
          tokenVersion: { increment: 1 },
        },
      });
      await tx.userVerificationCode.delete({
        where: {
          userId_purpose: { userId: user.id, purpose: PASSWORD_RESET_PURPOSE },
        },
      });
      return nextUser;
    });

    return { user: updated, token: await this.sign(updated) };
  }

  async getMe(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  private async updatePassword(
    id: string,
    password: string,
    status: AccountStatus,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: await hashPassword(password),
        status,
        tokenVersion: { increment: 1 },
      },
    });
  }

  private async sign(user: User): Promise<string> {
    return this.jwtService.signAsync(
      { sub: user.id, tokenVersion: user.tokenVersion },
      { expiresIn: this.cookieMaxAge },
    );
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private assertPassword(password: string): void {
    if (
      password.length < PASSWORD_MIN_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH
    ) {
      throw new BadRequestException(
        `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`,
      );
    }
  }

  private hashVerificationCode(userId: string, code: string): string {
    return createHmac('sha256', this.authSecret)
      .update(`${PASSWORD_RESET_PURPOSE}:${userId}:${code}`)
      .digest('base64url');
  }
}
