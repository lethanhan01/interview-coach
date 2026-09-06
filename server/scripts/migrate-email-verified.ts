import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaService } from '../src/infrastructure/database/prisma/prisma.service';

const prisma = new PrismaService();

async function main() {
  console.log('Migrating existing users to have emailVerified = true...');
  const result = await prisma.user.updateMany({
    where: { emailVerified: false },
    data: { emailVerified: true },
  });
  console.log(`Successfully updated ${result.count} users to emailVerified = true.`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
