import type { PrismaClient } from '@prisma/client';
import { CONTEXT_PACK_DATA } from '../../src/prisma/context-pack.data';
import { buildRubricCategoriesFromPack } from '../../src/prisma/rubric-versioning';

export async function seedContextPacks(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const pack of CONTEXT_PACK_DATA) {
      for (const categorySeed of buildRubricCategoriesFromPack(pack)) {
        const category = await tx.rubricCategory.upsert({
          where: {
            contextPackId_categoryKey: {
              contextPackId: pack.id,
              categoryKey: categorySeed.key,
            },
          },
          create: {
            contextPackId: pack.id,
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
              rubricCategoryId_code: {
                rubricCategoryId: category.id,
                code: criterionSeed.code,
              },
            },
            create: {
              rubricCategoryId: category.id,
              code: criterionSeed.code,
              name: criterionSeed.name,
              weight: criterionSeed.weight,
              displayOrder: criterionSeed.displayOrder,
              active: true,
            },
            update: {
              name: criterionSeed.name,
              weight: criterionSeed.weight,
              displayOrder: criterionSeed.displayOrder,
              active: true,
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
