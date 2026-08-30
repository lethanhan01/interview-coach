import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        profile: {
          select: {
            personality: true,
            education: true,
            workExperience: true,
            projects: true,
            technicalSkills: true,
            certifications: true,
            awards: true,
          },
        },
      },
    });
    if (!user) {
      throw new InterviewAIException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      profile: user.profile && {
        personality: user.profile.personality,
        education: user.profile.education,
        workExperience: user.profile.workExperience,
        projects: user.profile.projects,
        technicalSkills: user.profile.technicalSkills,
        certifications: user.profile.certifications,
        awards: user.profile.awards,
      },
    };
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
