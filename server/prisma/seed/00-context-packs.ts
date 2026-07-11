import { RubricVersionStatus, type PrismaClient } from '@prisma/client';
import { CONTEXT_PACK_DATA } from '../../src/prisma/context-pack.data';
import { buildRubricCategoriesFromPack } from '../../src/prisma/rubric-versioning';

export async function seedContextPacks(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const pack of CONTEXT_PACK_DATA) {
      await tx.contextPack.upsert({
        where: { id: pack.id },
        create: {
          id: pack.id,
          name: pack.name,
          rubricJson: pack.rubricJson,
          scoringWeights: pack.scoringWeights,
        },
        update: {
          name: pack.name,
        },
      });

      const activeVersion = await tx.rubricVersion.findFirst({
        where: { contextPackId: pack.id, status: RubricVersionStatus.active },
        select: { id: true },
      });
      if (!activeVersion) {
        const version = await tx.rubricVersion.upsert({
          where: {
            contextPackId_version: {
              contextPackId: pack.id,
              version: 'v1',
            },
          },
          create: {
            contextPackId: pack.id,
            version: 'v1',
            status: RubricVersionStatus.active,
            publishedAt: new Date(),
          },
          update: {
            status: RubricVersionStatus.active,
            publishedAt: new Date(),
          },
          select: { id: true },
        });

        for (const categorySeed of buildRubricCategoriesFromPack(pack)) {
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
        await tx.contextPack.deleteMany({ where: { id: legacyId } });
      }
    }
  });

  console.log('context_packs: canonical IDs ensured');
}
