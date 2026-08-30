import type { PrismaClient } from '@prisma/client';
import { CONTEXT_PACK_DATA } from './context-pack.data';

export async function migrateLegacyContextPackIds(
  prisma: PrismaClient,
): Promise<{ sessions: number; questions: number }> {
  return prisma.$transaction(async (tx) => {
    let sessions = 0;
    let questions = 0;

    for (const pack of CONTEXT_PACK_DATA) {
      for (const legacyId of pack.legacyIds) {
        const sessionResult = await tx.interviewSession.updateMany({
          where: { contextPackId: legacyId },
          data: { contextPackId: pack.id },
        });
        const questionResult = await tx.questionBank.updateMany({
          where: { contextPackId: legacyId },
          data: { contextPackId: pack.id },
        });
        sessions += sessionResult.count;
        questions += questionResult.count;
      }
    }

    return { sessions, questions };
  });
}
