import { Inject, Injectable, Logger } from '@nestjs/common';
import { SavedJobDescription } from '@prisma/client';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { type IOnetFacade, ONET_FACADE_TOKEN } from '@modules/onet/contracts';
import { SaveJobDescriptionDto } from './dto/save-job-description.dto';

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();
}

export function inferTargetSfiaLevel(
  level?: string | null,
  jobTitle?: string | null,
  jobContent?: string | null,
): number {
  // Tầng 1: Đánh giá chức danh công việc `jobTitle` (thường mang chức danh chính thức)
  if (jobTitle && typeof jobTitle === 'string' && jobTitle.trim()) {
    const normTitle = removeVietnameseTones(jobTitle.trim());
    if (
      /\b(lead|principal|architect|director|truong nhom|kien truc su|team lead|tech lead)\b/i.test(
        normTitle,
      )
    ) {
      return 5;
    }
    if (
      /\b(senior|sr\b|chuyen vien cao cap|chuyen vien chinh)\b/i.test(normTitle)
    ) {
      return 4;
    }
    if (/\b(intern|thuc tap|sinh vien|trainee)\b/i.test(normTitle)) {
      return 1;
    }
    if (
      /\b(junior|fresher|associate|moi tot nghiep|entry)\b/i.test(normTitle)
    ) {
      return 2;
    }
    if (/\b(middle|mid)\b/i.test(normTitle)) {
      return 3;
    }
  }

  // Tầng 2: Đánh giá trường `level` chỉ định trực tiếp từ form/user
  if (level && typeof level === 'string' && level.trim()) {
    const normLevel = removeVietnameseTones(level.trim());
    if (
      /\b(lead|principal|architect|director|truong nhom|kien truc su|team lead|tech lead)\b/i.test(
        normLevel,
      )
    ) {
      return 5;
    }
    if (
      /\b(senior|sr\b|chuyen vien cao cap|chuyen vien chinh)\b/i.test(normLevel)
    ) {
      return 4;
    }
    if (/\b(intern|thuc tap|sinh vien|trainee)\b/i.test(normLevel)) {
      return 1;
    }
    if (
      /\b(junior|fresher|associate|moi tot nghiep|entry)\b/i.test(normLevel)
    ) {
      return 2;
    }
    if (/\b(middle|mid|intermediate)\b/i.test(normLevel)) {
      return 3;
    }
  }

  // Tầng 3: Quét nội dung `jobContent` hoặc `requirements` bằng các cụm từ vai trò nghiêm ngặt
  if (jobContent && typeof jobContent === 'string' && jobContent.trim()) {
    const normContent = removeVietnameseTones(jobContent.trim());
    if (
      /\b(tech lead|team lead|principal engineer|lead developer|truong nhom phat trien)\b/i.test(
        normContent,
      )
    ) {
      return 5;
    }
    if (
      /\b(senior developer|senior engineer|senior backend|senior frontend|chuyen vien chinh)\b/i.test(
        normContent,
      )
    ) {
      return 4;
    }
    if (
      /\b(junior developer|junior engineer|fresher developer|lap trinh vien moi tot nghiep)\b/i.test(
        normContent,
      )
    ) {
      return 2;
    }
    if (/\b(thuc tap sinh|internship program)\b/i.test(normContent)) {
      return 1;
    }
  }

  // Mặc định an toàn cho các vai trò chưa xác định thâm niên: Middle (Level 3)
  return 3;
}

@Injectable()
export class SavedJobDescriptionService {
  private readonly logger = new Logger(SavedJobDescriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ONET_FACADE_TOKEN)
    private readonly onetFacade: IOnetFacade,
  ) {}

  findAll(userId: string): Promise<SavedJobDescription[]> {
    return this.prisma.savedJobDescription.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ lastUsedAt: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async save(
    userId: string,
    dto: SaveJobDescriptionDto,
  ): Promise<SavedJobDescription> {
    const data = this.normalize(dto);

    // Chuẩn hóa O*NET SOC và công nghệ
    const onetData = await this.enrichOnetAndSfiaMetadata(
      data.jobTitle,
      data.level,
      data.requirements,
      data.techStack,
      dto.onetSocCode,
      dto.onetOccupationTitle,
      dto.targetSfiaLevel,
    );

    const existing = await this.prisma.savedJobDescription.findFirst({
      where: {
        userId,
        deletedAt: null,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
      },
    });

    const lastUsedAt = new Date();
    const fullPayload = {
      ...data,
      ...onetData,
      lastUsedAt,
    };

    if (existing) {
      return this.prisma.savedJobDescription.update({
        where: { id: existing.id },
        data: fullPayload,
      });
    }

    return this.prisma.savedJobDescription.create({
      data: {
        ...fullPayload,
        userId,
      },
    });
  }

  private async enrichOnetAndSfiaMetadata(
    jobTitle: string,
    level?: string | null,
    requirements?: string | null,
    rawTechStack: string[] = [],
    customOnetSocCode?: string,
    customOnetOccupationTitle?: string,
    customTargetSfiaLevel?: number,
  ): Promise<{
    onetSocCode: string;
    onetOccupationTitle: string;
    targetSfiaLevel: number;
    normalizedTechStack: string[];
  }> {
    let onetSocCode = customOnetSocCode?.trim() || '15-1252.00';
    let onetOccupationTitle =
      customOnetOccupationTitle?.trim() || 'Software Developers';
    let normalizedTechStack: string[] = [...rawTechStack];

    if (!customOnetSocCode) {
      try {
        const occupation =
          await this.onetFacade.findOccupationByTitle(jobTitle);
        if (occupation) {
          onetSocCode = occupation.socCode;
          onetOccupationTitle = occupation.title;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to enrich O*NET metadata for job title "${jobTitle}": ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    try {
      const onetTools =
        await this.onetFacade.getToolsAndTechnology(onetSocCode);

      if (onetTools.length > 0) {
        const toolMap = new Map(
          onetTools.map((t) => [t.example.toLowerCase(), t.example]),
        );

        const matchedTech = new Set<string>();
        for (const item of rawTechStack) {
          const canonical = toolMap.get(item.toLowerCase());
          matchedTech.add(canonical || item);
        }

        if (matchedTech.size === 0) {
          const hotTech = onetTools
            .filter((t) => t.isHotTechnology)
            .slice(0, 5)
            .map((t) => t.example);
          hotTech.forEach((t) => matchedTech.add(t));
        }

        normalizedTechStack = Array.from(matchedTech);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to enrich O*NET tools for socCode "${onetSocCode}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const targetSfiaLevel =
      typeof customTargetSfiaLevel === 'number' &&
      customTargetSfiaLevel >= 1 &&
      customTargetSfiaLevel <= 7
        ? customTargetSfiaLevel
        : inferTargetSfiaLevel(level, jobTitle, requirements);

    return {
      onetSocCode,
      onetOccupationTitle,
      targetSfiaLevel,
      normalizedTechStack,
    };
  }

  private normalize(dto: SaveJobDescriptionDto) {
    const trimOptional = (value?: string) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : null;
    };

    return {
      companyName: dto.companyName.trim(),
      companyWebsite: trimOptional(dto.companyWebsite),
      jobTitle: dto.jobTitle.trim(),
      level: dto.level?.trim() || null,
      headcount: trimOptional(dto.headcount),
      location: trimOptional(dto.location),
      requirements: dto.requirements.trim(),
      jobContent: dto.jobContent.trim(),
      techStack:
        dto.techStack?.map((item) => item.trim()).filter(Boolean) ?? [],
      benefits: trimOptional(dto.benefits),
      salary: trimOptional(dto.salary),
      bonus: trimOptional(dto.bonus),
    };
  }
}
