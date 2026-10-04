import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { UserAccountResponseDto } from './dto/user-account-response.dto';
import { UpdateUserAccountDto } from './dto/update-user-account.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccount(userId: string): Promise<UserAccountResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new InterviewAIException(
        ErrorCode.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'User not found',
      );
    }

    return {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  async updateAccount(
    userId: string,
    dto: UpdateUserAccountDto,
  ): Promise<UserAccountResponseDto> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, firstname: true, lastname: true },
    });

    if (!currentUser) {
      throw new InterviewAIException(
        ErrorCode.USER_NOT_FOUND,
        HttpStatus.NOT_FOUND,
        'User not found',
      );
    }

    if (currentUser.role === 'candidate') {
      const newFirstname = dto.firstname ?? currentUser.firstname;
      const newLastname = dto.lastname ?? currentUser.lastname;

      if (!newFirstname?.trim() || !newLastname?.trim()) {
        throw new InterviewAIException(
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          'Candidate first name and last name are required',
        );
      }
    }

    const dataToUpdate = this.stripUndefined({
      firstname: dto.firstname,
      lastname: dto.lastname,
    });

    if (Object.keys(dataToUpdate).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });
    }

    return this.getAccount(userId);
  }

  private stripUndefined(dto: UpdateUserAccountDto) {
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined) continue;
      data[key] = value;
    }
    return data;
  }
}
