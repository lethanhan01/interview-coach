import { Injectable, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { UpdateProfileDto } from './dto/update-profile.dto';

/**
 * Các field thuộc CV/Resume — lưu ở bảng `resumes` (parsed_json), không ở
 * `user_profiles`. API contract giữ phẳng: getProfile merge ngược, upsertProfile
 * tách ra. Xem schema-design-review SR-02.
 */
const RESUME_FIELDS = [
  'education',
  'workExperience',
  'projects',
  'technicalSkills',
  'certifications',
  'awards',
] as const;

type ResumeField = (typeof RESUME_FIELDS)[number];

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        resumes: {
          where: { active: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!user) {
      throw new InterviewAIException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return this.mergeResumeIntoProfile(user);
  }

  async upsertProfile(userId: string, dto: UpdateProfileDto) {
    const { profileData, resumePatch } = this.splitDto(dto);

    await this.prisma.userProfile.upsert({
      where: { userId },
      create: { ...profileData, userId },
      update: profileData,
    });

    if (Object.keys(resumePatch).length > 0) {
      await this.upsertManualResume(userId, resumePatch);
    }

    return this.getProfile(userId);
  }

  /** Tách dto thành field profile thuần và field resume (loại undefined). */
  private splitDto(dto: UpdateProfileDto) {
    const profileData: Record<string, unknown> = {};
    const resumePatch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value === undefined) continue;
      if ((RESUME_FIELDS as readonly string[]).includes(key)) {
        resumePatch[key] = value;
      } else {
        profileData[key] = value;
      }
    }
    return { profileData, resumePatch };
  }

  /**
   * Một user có tối đa một resume thủ công (active). Patch merge vào parsed_json
   * hiện có để PATCH từng phần không xóa field khác.
   */
  private async upsertManualResume(
    userId: string,
    patch: Record<string, unknown>,
  ) {
    const existing = await this.prisma.resume.findFirst({
      where: { userId, active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      const merged = {
        ...(existing.parsedJson as Record<string, unknown> | null),
        ...patch,
      };
      await this.prisma.resume.update({
        where: { id: existing.id },
        data: { parsedJson: merged as Prisma.InputJsonObject },
      });
    } else {
      await this.prisma.resume.create({
        data: {
          userId,
          parsedJson: patch as Prisma.InputJsonObject,
          parserVersion: 'manual',
          active: true,
        },
      });
    }
  }

  /** Trải parsed_json của resume active vào object profile, bỏ mảng resumes khỏi response. */
  private mergeResumeIntoProfile<
    T extends { profile: Record<string, unknown> | null; resumes?: unknown[] },
  >(user: T) {
    const { resumes, ...rest } = user;
    const active = (resumes?.[0] ?? null) as { parsedJson: unknown } | null;
    const parsed =
      (active?.parsedJson as Partial<Record<ResumeField, unknown>> | null) ??
      {};
    return {
      ...rest,
      profile: rest.profile ? { ...rest.profile, ...parsed } : rest.profile,
    };
  }
}
