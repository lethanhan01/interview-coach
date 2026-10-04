import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import type { IUserFacade } from '@modules/user/contracts/user.facade.interface';
import { USER_FACADE_TOKEN } from '@modules/user/contracts/user.facade.interface';
import { CandidateProfileResponseDto } from './dto/candidate-profile-response.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';

@Injectable()
export class CandidateProfileService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(USER_FACADE_TOKEN)
    private readonly userFacade: IUserFacade,
  ) {}

  async getProfile(userId: string): Promise<CandidateProfileResponseDto> {
    const user = await this.userFacade.getUserAccount(userId);

    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: {
        targetPosition: true,
        targetLevel: true,
        onetSocCode: true,
        onetOccupationTitle: true,
        targetSfiaLevel: true,
        personality: true,
        education: true,
        workExperience: true,
        projects: true,
        technicalSkills: true,
        certifications: true,
        awards: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      profile: profile && {
        targetPosition: profile.targetPosition,
        targetLevel: profile.targetLevel,
        onetSocCode: profile.onetSocCode,
        onetOccupationTitle: profile.onetOccupationTitle,
        targetSfiaLevel: profile.targetSfiaLevel,
        personality: profile.personality,
        education: profile.education,
        workExperience: profile.workExperience,
        projects: profile.projects,
        technicalSkills: profile.technicalSkills,
        certifications: profile.certifications,
        awards: profile.awards,
      },
    };
  }

  async upsertProfile(
    userId: string,
    dto: UpdateCandidateProfileDto,
  ): Promise<CandidateProfileResponseDto> {
    // Ensure user exists (throws 404 if not found)
    await this.userFacade.getUserAccount(userId);

    const profileData = this.stripUndefined({
      targetPosition: dto.targetPosition,
      targetLevel: dto.targetLevel,
      onetSocCode: dto.onetSocCode,
      onetOccupationTitle: dto.onetOccupationTitle,
      targetSfiaLevel: dto.targetSfiaLevel,
      personality: dto.personality,
      education: dto.education,
      workExperience: dto.workExperience,
      projects: dto.projects,
      technicalSkills: dto.technicalSkills,
      certifications: dto.certifications,
      awards: dto.awards,
    });

    await this.prisma.userProfile.upsert({
      where: { userId },
      create: { ...profileData, userId },
      update: profileData,
    });

    return this.getProfile(userId);
  }

  private stripUndefined(dto: UpdateCandidateProfileDto) {
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined) continue;
      data[key] = value;
    }
    return data;
  }
}
