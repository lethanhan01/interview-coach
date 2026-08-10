import { migrateLegacyContextPackIds } from '../src/assessment/rubric/legacy-context-pack-migration';
import { prisma } from './seed/_client';

migrateLegacyContextPackIds(prisma)
  .then((result) => console.log('legacy context-pack IDs migrated', result))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
