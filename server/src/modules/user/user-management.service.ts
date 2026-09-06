import { HttpStatus, Injectable } from '@nestjs/common';
import { AccountStatus, UserRole } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';

@Injectable()
export class UserManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(includeDeleted = false) {
    return this.prisma.user.findMany({
      where: includeDeleted ? {} : { status: { not: AccountStatus.deleted } },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    });
  }

  async updateUser(
    id: string,
    actorId: string,
    changes: { role?: UserRole; status?: AccountStatus },
  ) {
    await this.assertAdminCanManage(id, actorId);
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new InterviewAIException(
        ErrorCode.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'User not found',
      );
    }
    if (!changes.role && !changes.status) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'At least one account field is required',
      );
    }
    if (changes.status === AccountStatus.password_reset_required) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Use the password reset flow for this status',
      );
    }
    return this.prisma.user.update({
      where: { id },
      data: { ...changes, tokenVersion: { increment: 1 } },
      select: { id: true, email: true, role: true, status: true },
    });
  }

  async deleteUser(id: string, actorId: string) {
    await this.assertAdminCanManage(id, actorId);
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.status === AccountStatus.deleted) {
      throw new InterviewAIException(
        ErrorCode.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'User not found',
      );
    }
    await this.prisma.user.update({
      where: { id },
      data: { status: AccountStatus.deleted, tokenVersion: { increment: 1 } },
    });
  }

  private async assertAdminCanManage(
    id: string,
    actorId: string,
  ): Promise<void> {
    if (id === actorId) {
      throw new InterviewAIException(
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        'Administrators cannot manage their own account',
      );
    }
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new InterviewAIException(
        ErrorCode.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'User not found',
      );
    }
    if (target.role === UserRole.admin) {
      const adminCount = await this.prisma.user.count({
        where: { role: UserRole.admin, status: { not: AccountStatus.deleted } },
      });
      if (adminCount <= 1) {
        throw new InterviewAIException(
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          'The last active administrator cannot be managed',
        );
      }
    }
  }
}
