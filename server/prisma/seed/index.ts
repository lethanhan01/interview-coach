import { prisma, supabaseAdmin } from './_client';
import { seedContextPacks } from './00-context-packs';
import { getOrCreateDemoUser, seedUserProfile } from './01-users';
import { seedQuestionBank } from './02-question-bank';
import { seedSessions } from './03-sessions';
import { seedAiQualityLog } from './04-ai-quality-log';
import { seedSavedJobDescriptions } from './05-saved-job-descriptions';

async function main(): Promise<void> {
  console.log('=== Seed start ===');

  await seedContextPacks(prisma);

  const userId = await getOrCreateDemoUser(supabaseAdmin, prisma);
  await seedUserProfile(prisma, userId);

  await seedQuestionBank(prisma);
  const sessionIds = await seedSessions(prisma, userId);
  await seedAiQualityLog(prisma, sessionIds);
  await seedSavedJobDescriptions(prisma, userId);

  console.log('=== Seed complete ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
