import { migrateLegacyContextPackIds } from '../src/modules/interview-assessment/evaluation/rubric/legacy-context-pack-migration';
import { prisma } from './seed/_client';

migrateLegacyContextPackIds(prisma)
  .then((result) => console.log('legacy context-pack IDs migrated', result))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
