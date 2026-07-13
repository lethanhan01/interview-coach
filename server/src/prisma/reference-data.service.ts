import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from './prisma.service';
import { CONTEXT_PACK_DATA, ContextPackId } from './context-pack.data';
import {
  buildRubricCategoriesFromPack,
  buildRubricSnapshot,
} from './rubric-versioning';
import {
  formatDatabaseStartupError,
  isTransientPrismaConnectionError,
} from './prisma-connection-error';

@Injectable()
export class ReferenceDataService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReferenceDataService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.prisma.isBootstrapDatabaseAvailable()) {
      this.logger.warn(
        'Skipping context pack legacy-id sync because the database was not reachable during startup.',
      );
      return;
    }

    try {
      await this.ensureContextPacks();
    } catch (error) {
      if (!isTransientPrismaConnectionError(error)) {
        throw error;
      }

      this.logger.warn(
        `Skipping context pack legacy-id sync because the database connection became unavailable: ${formatDatabaseStartupError(error)}`,
      );
    }
  }

  async ensureContextPack(id: ContextPackId): Promise<void> {
    await Promise.resolve();
    const pack = CONTEXT_PACK_DATA.find((item) => item.id === id);
    if (!pack) {
      throw new Error(`Unsupported context pack: ${id}`);
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
      }
    }

    await this.ensureDefaultActiveRubricVersions();

    this.logger.log(
      'Context pack constants and active rubric versions are ready',
    );
  }

  async ensureActiveRubricVersion(id: ContextPackId): Promise<string> {
    await this.ensureContextPack(id);
    await this.ensureDefaultActiveRubricVersion(id);

    const version = await this.prisma.rubricVersion.findFirst({
      where: { contextPackId: id, status: 'active' },
      orderBy: { publishedAt: 'desc' },
      select: { id: true },
    });
    if (!version) {
      throw new Error(`No active rubric version for context pack: ${id}`);
    }
    return version.id;
  }

  async ensureDefaultActiveRubricVersions(): Promise<void> {
    for (const pack of CONTEXT_PACK_DATA) {
      await this.ensureDefaultActiveRubricVersion(pack.id);
    }
  }

  private async ensureDefaultActiveRubricVersion(
    id: ContextPackId,
  ): Promise<void> {
    const pack = CONTEXT_PACK_DATA.find((item) => item.id === id);
    if (!pack) {
      throw new Error(`Unsupported context pack: ${id}`);
    }

    const categories = buildRubricCategoriesFromPack(pack);
    const checksum = createHash('sha256')
      .update(JSON.stringify(buildRubricSnapshot(categories)))
      .digest('hex');

    await this.prisma.$transaction(async (tx) => {
      const version = await tx.rubricVersion.upsert({
        where: {
          contextPackId_versionKey: {
            contextPackId: pack.id,
            versionKey: 'v1',
          },
        },
        create: {
          contextPackId: pack.id,
          versionKey: 'v1',
          status: 'active',
          checksum,
        },
        update: {
          status: 'active',
          checksum,
        },
        select: { id: true },
      });

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
          update: {
            label: categorySeed.label,
            weight: categorySeed.weight,
            displayOrder: categorySeed.displayOrder,
          },
          select: { id: true },
        });

        for (const criterionSeed of categorySeed.criteria) {
          const existingCriterion = await tx.rubricCriterion.findFirst({
            where: {
              code: criterionSeed.code,
              rubricCategory: {
                rubricVersionId: version.id,
              },
            },
            select: { id: true },
          });

          if (existingCriterion) {
            await tx.rubricCriterion.update({
              where: { id: existingCriterion.id },
              data: {
                rubricCategoryId: category.id,
                name: criterionSeed.name,
                weight: criterionSeed.weight,
                displayOrder: criterionSeed.displayOrder,
              },
            });
            continue;
          }

          await tx.rubricCriterion.create({
            data: {
              rubricCategoryId: category.id,
              code: criterionSeed.code,
              name: criterionSeed.name,
              weight: criterionSeed.weight,
              displayOrder: criterionSeed.displayOrder,
            },
          });
        }
      }
    });
  }
}
