import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { RubricVersionStatus } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { CONTEXT_PACK_DATA, ContextPackId } from './context-pack.data';
import { buildRubricCategoriesFromPack } from './rubric-versioning';

@Injectable()
export class ReferenceDataService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReferenceDataService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureContextPacks();
  }

  async ensureContextPack(id: ContextPackId): Promise<void> {
    const pack = CONTEXT_PACK_DATA.find((item) => item.id === id);
    if (!pack) {
      throw new Error(`Unsupported context pack: ${id}`);
    }

    try {
      await this.prisma.contextPack.upsert({
        where: { id: pack.id },
        create: {
          id: pack.id,
          name: pack.name,
        },
        update: {
          name: pack.name,
        },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Unable to ensure context pack ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async ensureContextPacks(): Promise<void> {
    for (const pack of CONTEXT_PACK_DATA) {
      await this.ensureContextPack(pack.id);
    }

    for (const pack of CONTEXT_PACK_DATA) {
      for (const legacyId of pack.legacyIds) {
        await this.prisma.interviewSession.updateMany({
          where: { contextPackId: legacyId },
          data: { contextPackId: pack.id },
        });
        await this.prisma.questionBank.updateMany({
          where: { contextPackId: legacyId },
          data: { contextPackId: pack.id },
        });
        await this.prisma.contextPack.deleteMany({
          where: { id: legacyId },
        });
      }
    }

    this.logger.log('Context pack reference data is ready');
  }

  async getActiveRubricVersionId(id: ContextPackId): Promise<string> {
    const activeVersion = await this.prisma.rubricVersion.findFirst({
      where: { contextPackId: id, status: RubricVersionStatus.active },
      select: { id: true },
    });

    if (!activeVersion) {
      throw new Error(`No active rubric version found for context pack ${id}`);
    }

    return activeVersion.id;
  }

  async ensureDefaultActiveRubricVersion(id: ContextPackId): Promise<string> {
    const pack = CONTEXT_PACK_DATA.find((item) => item.id === id);
    if (!pack) {
      throw new Error(`Unsupported context pack: ${id}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const activeVersion = await tx.rubricVersion.findFirst({
        where: { contextPackId: id, status: RubricVersionStatus.active },
        select: { id: true },
      });
      if (activeVersion) return activeVersion.id;

      const categories = buildRubricCategoriesFromPack(pack);
      const existingV1 = await tx.rubricVersion.findFirst({
        where: { contextPackId: id, version: 'v1' },
        select: { id: true },
      });

      const version =
        existingV1 ??
        (await tx.rubricVersion.create({
          data: {
            contextPackId: id,
            version: 'v1',
            status: RubricVersionStatus.active,
            publishedAt: new Date(),
          },
          select: { id: true },
        }));

      if (existingV1) {
        await tx.rubricVersion.update({
          where: { id: version.id },
          data: {
            status: RubricVersionStatus.active,
            publishedAt: new Date(),
          },
        });
      }

      for (const categorySeed of categories) {
        const category = await tx.rubricCategory.upsert({
          where: {
            rubricVersionId_categoryKey: {
              rubricVersionId: version.id,
              categoryKey: categorySeed.key,
            },
          },
          create: {
            rubricVersionId: version.id,
            categoryKey: categorySeed.key,
            label: categorySeed.label,
            weight: categorySeed.weight,
            displayOrder: categorySeed.displayOrder,
          },
          update: {},
          select: { id: true },
        });

        for (const criterionSeed of categorySeed.criteria) {
          await tx.rubricCriterion.upsert({
            where: {
              rubricVersionId_code: {
                rubricVersionId: version.id,
                code: criterionSeed.code,
              },
            },
            create: {
              rubricVersionId: version.id,
              rubricCategoryId: category.id,
              code: criterionSeed.code,
              name: criterionSeed.name,
              weight: criterionSeed.weight,
              displayOrder: criterionSeed.displayOrder,
              active: true,
            },
            update: {},
          });
        }
      }

      return version.id;
    });
  }
}
