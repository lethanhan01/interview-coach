import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { CONTEXT_PACK_DATA } from '../src/prisma/context-pack.data';
import { ReferenceDataService } from '../src/prisma/reference-data.service';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL is required.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  const referenceData = new ReferenceDataService(prisma as never);

  try {
    await prisma.$connect();
    await referenceData.ensureContextPacks();
    for (const pack of CONTEXT_PACK_DATA) {
      await referenceData.ensureDefaultActiveRubricVersion(pack.id);
    }
    console.log('rubric_versions: default active versions ensured');
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
