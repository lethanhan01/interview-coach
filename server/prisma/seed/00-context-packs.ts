import type { PrismaClient } from '@prisma/client';
import { CONTEXT_PACK_DATA } from '../../src/prisma/context-pack.data';

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
          rubricJson: pack.rubricJson,
          scoringWeights: pack.scoringWeights,
        },
      });
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
