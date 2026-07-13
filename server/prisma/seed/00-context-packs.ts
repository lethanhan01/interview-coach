import type { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { CONTEXT_PACK_DATA } from '../../src/prisma/context-pack.data';
import {
  buildRubricCategoriesFromPack,
  buildRubricSnapshot,
} from '../../src/prisma/rubric-versioning';

export async function seedContextPacks(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const pack of CONTEXT_PACK_DATA) {
      const categories = buildRubricCategoriesFromPack(pack);
      const checksum = createHash('sha256')
        .update(JSON.stringify(buildRubricSnapshot(categories)))
        .digest('hex');
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
            },
            update: {
              rubricCategoryId: category.id,
              name: criterionSeed.name,
              weight: criterionSeed.weight,
              displayOrder: criterionSeed.displayOrder,
            },
          });
        }
      }
    }

    for (const pack of CONTEXT_PACK_DATA) {
      for (const legacyId of pack.legacyIds) {
        await tx.interviewSession.updateMany({
          where: { contextPackId: legacyId },
          data: { contextPackId: pack.id },
        });
        await tx.questionBank.updateMany({
          where: { contextPackId: legacyId },
          data: { contextPackId: pack.id },
        });
      }
    }
  });

  console.log('context pack constants and rubric categories ensured');
}
