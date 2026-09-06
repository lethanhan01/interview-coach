import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaService } from '../src/infrastructure/database/prisma/prisma.service';
import { hashPassword } from '../src/modules/auth/password';

const prisma = new PrismaService();

async function main() {
  console.log('Updating password for demo@interviewai.dev to Demo@1234567...');
  const newHash = await hashPassword('Demo@1234567');
  const result = await prisma.user.update({
    where: { email: 'demo@interviewai.dev' },
    data: { passwordHash: newHash },
  });
  console.log(`Successfully updated password for ${result.email} (ID: ${result.id})`);
}

main()
  .catch((e) => {
    console.error('Update failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
