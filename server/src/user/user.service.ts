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
    const profileData = this.stripUndefined(dto);

    await this.prisma.userProfile.upsert({
      where: { userId },
      create: { ...profileData, userId },
      update: profileData,
    });

    return this.getProfile(userId);
  }

  private stripUndefined(dto: UpdateProfileDto) {
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined) continue;
      data[key] = value;
    }
    return data;
  }
}
