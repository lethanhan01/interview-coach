import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus, UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import * as passwordModule from './password';

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockJwt: any;
  let mockConfig: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn((cb) => cb(mockPrisma)),
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      userProfile: {
        create: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      userVerificationCode: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    mockJwt = {
      signAsync: jest.fn().mockResolvedValue('mock-access-token'),
      verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1', tokenVersion: 0 }),
    };

    mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'AUTH_ACCESS_COOKIE_NAME') return 'interviewcoach_access';
        if (key === 'AUTH_REFRESH_COOKIE_NAME') return 'interviewcoach_refresh';
        if (key === 'AUTH_ACCESS_COOKIE_MAX_AGE') return 900;
        if (key === 'AUTH_REFRESH_COOKIE_MAX_AGE') return 604800;
        if (key === 'PASSWORD_RESET_OTP_TTL_MINUTES') return 15;
        if (key === 'SMTP_PORT') return 587;
        return undefined;
      }),
      getOrThrow: jest.fn((key: string) => {
        if (key === 'AUTH_JWT_SECRET') return 'test-secret-key-32-chars-long-xxx';
        if (key === 'SMTP_HOST') return 'smtp.example.com';
        if (key === 'SMTP_PORT') return 587;
        if (key === 'SMTP_USER') return 'user';
        if (key === 'SMTP_PASSWORD') return 'pass';
        return 'test';
      }),
    };

    authService = new AuthService(
      mockPrisma as unknown as PrismaService,
      mockJwt as unknown as JwtService,
      mockConfig as unknown as ConfigService,
    );
    // Mock mailer
    (authService as any).mailer = {
      sendMail: jest.fn().mockResolvedValue(true),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifySessionToken', () => {
    it('returns user payload when token is valid and user is active', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        role: UserRole.candidate,
        status: AccountStatus.active,
        tokenVersion: 0,
        emailVerified: true,
      });

      const payload = await authService.verifySessionToken('valid-token');
      expect(payload).toEqual({
        id: 'user-1',
        email: 'user@example.com',
        role: UserRole.candidate,
        emailVerified: true,
      });
    });

    it('throws UNAUTHORIZED when tokenVersion does not match', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        role: UserRole.candidate,
        status: AccountStatus.active,
        tokenVersion: 2, // mismatch with payload tokenVersion: 0
        emailVerified: true,
      });

      await expect(authService.verifySessionToken('valid-token')).rejects.toThrow(
        InterviewAIException,
      );
    });

    it('throws UNAUTHORIZED when account is locked or deleted', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        role: UserRole.candidate,
        status: AccountStatus.locked,
        tokenVersion: 0,
        emailVerified: true,
      });

      await expect(authService.verifySessionToken('valid-token')).rejects.toThrow(
        InterviewAIException,
      );
    });
  });

  describe('login', () => {
    it('successfully logs in with valid credentials and issues dual tokens', async () => {
      const mockPasswordHash = 'hashed-password';
      jest.spyOn(passwordModule, 'verifyPassword').mockResolvedValue(true);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: mockPasswordHash,
        status: AccountStatus.active,
        role: UserRole.candidate,
        tokenVersion: 0,
        emailVerified: true,
      });

      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await authService.login('test@example.com', 'ValidPassw0rd123!');
      expect(result.user.id).toBe('user-1');
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(typeof result.tokens.refreshToken).toBe('string');
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });

    it('throws UNAUTHORIZED for incorrect password', async () => {
      jest.spyOn(passwordModule, 'verifyPassword').mockResolvedValue(false);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hash',
        status: AccountStatus.active,
      });

      await expect(
        authService.login('test@example.com', 'WrongPassw0rd123!'),
      ).rejects.toThrow(
        new InterviewAIException(
          ErrorCode.INVALID_CREDENTIALS,
          HttpStatus.UNAUTHORIZED,
          'Invalid email or password',
        ),
      );
    });

    it('throws UNAUTHORIZED when account is inactive or locked', async () => {
      jest.spyOn(passwordModule, 'verifyPassword').mockResolvedValue(true);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hash',
        status: AccountStatus.locked,
      });

      await expect(
        authService.login('test@example.com', 'ValidPassw0rd123!'),
      ).rejects.toThrow(
        new InterviewAIException(
          ErrorCode.ACCOUNT_INACTIVE,
          HttpStatus.UNAUTHORIZED,
          'This account is not active',
        ),
      );
    });
  });

  describe('refreshSession', () => {
    it('detects token reuse and revokes all user sessions when token was already revoked', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        tokenHash: 'hash',
        revokedAt: new Date(Date.now() - 3600), // Already revoked!
        expiresAt: new Date(Date.now() + 3600),
        user: { id: 'user-1', status: AccountStatus.active },
      });

      await expect(authService.refreshSession('compromised-token')).rejects.toThrow(
        InterviewAIException,
      );
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { tokenVersion: { increment: 1 } },
        }),
      );
    });

    it('rotates refresh token and issues new dual tokens on valid refresh', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-1',
        userId: 'user-1',
        tokenHash: 'hash',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 3600),
        user: {
          id: 'user-1',
          status: AccountStatus.active,
          email: 'u@example.com',
          role: UserRole.candidate,
          tokenVersion: 0,
          emailVerified: true,
        },
      });

      const result = await authService.refreshSession('valid-refresh-token');
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'token-1' },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe('resetPassword & OTP Brute-Force defense', () => {
    it('refuses to reset password if user account is locked', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-locked',
        email: 'locked@example.com',
        status: AccountStatus.locked,
      });

      await expect(
        authService.resetPassword('locked@example.com', '123456', 'NewPassword123!'),
      ).rejects.toThrow(
        new InterviewAIException(
          ErrorCode.ACCOUNT_INACTIVE,
          HttpStatus.UNAUTHORIZED,
          'This account is locked. Please contact support.',
        ),
      );
    });

    it('increments attempts on wrong OTP and deletes OTP after 5 failed attempts', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'u@example.com',
        status: AccountStatus.active,
      });

      mockPrisma.userVerificationCode.findUnique.mockResolvedValue({
        id: 'code-1',
        userId: 'user-1',
        purpose: 'password_reset_otp',
        codeHash: 'different-hash',
        attempts: 4, // Next wrong attempt is 5th
        expiresAt: new Date(Date.now() + 600000),
      });

      await expect(
        authService.resetPassword('u@example.com', '999999', 'NewPassword123!'),
      ).rejects.toThrow('Mã OTP đã bị hủy do nhập sai quá 5 lần');

      expect(mockPrisma.userVerificationCode.delete).toHaveBeenCalledWith({
        where: { id: 'code-1' },
      });
    });
  });

  describe('confirmEmailVerification', () => {
    it('successfully updates emailVerified = true when OTP is correct', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        status: AccountStatus.active,
        email: 'u@example.com',
        role: UserRole.candidate,
        tokenVersion: 0,
        emailVerified: false,
      });

      const correctHash = (authService as any).hashVerificationCode(
        'user-1',
        '123456',
        'email_verification_otp',
      );

      mockPrisma.userVerificationCode.findUnique.mockResolvedValue({
        id: 'code-1',
        userId: 'user-1',
        purpose: 'email_verification_otp',
        codeHash: correctHash,
        attempts: 0,
        expiresAt: new Date(Date.now() + 600000),
      });

      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        status: AccountStatus.active,
        email: 'u@example.com',
        role: UserRole.candidate,
        tokenVersion: 0,
        emailVerified: true,
      });

      const result = await authService.confirmEmailVerification('user-1', '123456');
      expect(result.user.emailVerified).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { emailVerified: true },
        }),
      );
      expect(mockPrisma.userVerificationCode.delete).toHaveBeenCalled();
    });
  });
});
