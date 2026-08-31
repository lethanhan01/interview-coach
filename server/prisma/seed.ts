import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { buildPgConnectionConfig } from '../src/infrastructure/database/prisma/db-timezone';
import { provisionDefaultRubricCatalog } from '../src/modules/interview-assessment/evaluation/rubric/rubric-catalog-provision';
import { seedSfiaV9Catalog } from './seeds/sfia-v9.seed';
import { backfillCompanyProfiles } from './seeds/backfill-companies';

async function main() {
  const adapter = new PrismaPg(buildPgConnectionConfig(process.env['DATABASE_URL']));
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('--- Starting Database Seed & Migration Workflow ---');

    // 1. Legacy Rubric Provisioning
    console.log('1. Provisioning Legacy Rubric Catalog...');
    await provisionDefaultRubricCatalog(prisma);

    // 2. SFIA 9 Framework Seed
    console.log('2. Provisioning SFIA 9 Framework...');
    await seedSfiaV9Catalog(prisma);

    // 3. Backfill Companies
    console.log('3. Backfilling Company Profiles...');
    await backfillCompanyProfiles(prisma);

    console.log('--- Database Seed & Migration Completed Successfully ---');
  } catch (error) {
    console.error('Seed workflow failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
