import { prisma } from './seed/_client';
import { seedDemoUsers } from './seed/01-users';

async function main(): Promise<void> {
  await seedDemoUsers(prisma);
  console.log('demo users: ready');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
