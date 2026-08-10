import { Injectable } from '@nestjs/common';
import { SavedJobDescription } from '@prisma/client';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { SaveJobDescriptionDto } from './dto/save-job-description.dto';

@Injectable()
export class SavedJobDescriptionService {
  constructor(private readonly prisma: PrismaService) {}

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
    const existing = await this.prisma.savedJobDescription.findFirst({
      where: {
        userId,
        deletedAt: null,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
      },
    });

    const lastUsedAt = new Date();
    if (existing) {
      return this.prisma.savedJobDescription.update({
        where: { id: existing.id },
        data: { ...data, lastUsedAt },
      });
    }

    return this.prisma.savedJobDescription.create({
      data: { ...data, userId, lastUsedAt },
    });
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
      level: dto.level.trim(),
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
