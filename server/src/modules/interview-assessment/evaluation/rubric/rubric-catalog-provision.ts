import type { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { CONTEXT_PACK_DATA } from './context-pack.data';
import {
  buildRubricCategoriesFromPack,
  buildRubricSnapshot,
} from './rubric-versioning';

export async function provisionDefaultRubricCatalog(
  prisma: PrismaClient,
): Promise<void> {
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
        update: { status: 'active', checksum },
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
              rubricCategory: { rubricVersionId: version.id },
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
          } else {
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
      }
    }
  });
}
