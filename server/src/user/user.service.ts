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
    const userData = this.stripUndefined({
      firstname: dto.firstname,
      lastname: dto.lastname,
    });
    const profileData = this.stripUndefined({
      personality: dto.personality,
      education: dto.education,
      workExperience: dto.workExperience,
      projects: dto.projects,
      technicalSkills: dto.technicalSkills,
      certifications: dto.certifications,
      awards: dto.awards,
    });

    await this.prisma.$transaction(async (tx) => {
      const currentUser = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true, firstname: true, lastname: true },
      });
      if (!currentUser) {
        throw new InterviewAIException(
          ErrorCode.NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }
      if (currentUser.role === 'candidate') {
        const firstname =
          (userData.firstname as string | null | undefined) ??
          currentUser.firstname;
        const lastname =
          (userData.lastname as string | null | undefined) ??
          currentUser.lastname;
        if (!firstname?.trim() || !lastname?.trim()) {
          throw new InterviewAIException(
            ErrorCode.VALIDATION_ERROR,
            HttpStatus.BAD_REQUEST,
            'Candidate first name and last name are required',
          );
        }
      }
      if (Object.keys(userData).length > 0) {
        await tx.user.update({ where: { id: userId }, data: userData });
      }

      await tx.userProfile.upsert({
        where: { userId },
        create: { ...profileData, userId },
        update: profileData,
      });
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
