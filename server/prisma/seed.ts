import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { buildPgConnectionConfig } from '../src/infrastructure/database/prisma/db-timezone';
import { seedSfiaV9Catalog } from './seeds/sfia-v9.seed';
import { backfillCompanyProfiles } from './seeds/backfill-companies';
import { mapQuestionBankCriteria } from './seeds/map-question-criteria.seed';

async function main() {
  const adapter = new PrismaPg(buildPgConnectionConfig(process.env['DATABASE_URL']));
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('--- Starting Database Seed & Migration Workflow ---');

    // 1. SFIA 9 Framework Seed (Flattened Taxonomy & Criteria)
    console.log('1. Provisioning SFIA 9 Framework...');
    await seedSfiaV9Catalog(prisma);

    // 2. Backfill Companies
    console.log('2. Backfilling Company Profiles...');
    await backfillCompanyProfiles(prisma);

    // 3. Map Question Bank to SFIA 9 Criteria
    console.log('3. Mapping Question Bank to SFIA 9 Criteria...');
    await mapQuestionBankCriteria(prisma);

    console.log('--- Database Seed & Migration Completed Successfully ---');
  } catch (error) {
    console.error('Seed workflow failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
