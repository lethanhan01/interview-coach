import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) {
      throw new InterviewAIException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async upsertProfile(userId: string, dto: UpdateProfileDto) {
    const updateData = {
      ...dto,
      ...(dto.dateOfBirth !== undefined
        ? { dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null }
        : {}),
    };

    await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        ...(updateData as Record<string, unknown>),
        userId,
      } as Parameters<typeof this.prisma.userProfile.create>[0]['data'],
      update: updateData as Parameters<
        typeof this.prisma.userProfile.update
      >[0]['data'],
    });

    return this.getProfile(userId);
  }
}
