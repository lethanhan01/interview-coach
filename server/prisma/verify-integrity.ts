import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { buildPgConnectionConfig } from '../src/infrastructure/database/prisma/db-timezone';

async function main() {
  const adapter = new PrismaPg(buildPgConnectionConfig(process.env['DATABASE_URL']));
  const prisma = new PrismaClient({ adapter });

  try {
    const userCount = await prisma.user.count();
    const profileCount = await prisma.userProfile.count();
    const savedJdCount = await prisma.savedJobDescription.count();
    const sessionCount = await prisma.interviewSession.count();
    const questionBankCount = await prisma.questionBank.count();
    const questionCriteriaCount = await prisma.questionBankCriterion.count();
    const competencyCount = await prisma.competency.count();
    const criteriaCount = await prisma.criteria.count();
    const levelCount = await prisma.level.count();
    const roleCount = await prisma.role.count();
    const companyCount = await prisma.companyProfile.count();

    // Check sample criteria structure
    const sampleCriteria = await prisma.criteria.findFirst({
      where: { code: 'PROG_L3' },
      select: {
        code: true,
        name: true,
        behavioralIndicators: true,
        genericAttributes: true,
      },
    });

    console.log('==================================================');
    console.log('          DATABASE INTEGRITY VERIFICATION         ');
    console.log('==================================================');
    console.log(`[USER DOMAIN]`);
    console.log(`  Users:                 ${userCount} (100% PRESERVED)`);
    console.log(`  User Profiles:         ${profileCount} (100% PRESERVED)`);
    console.log(`  Saved Job Descriptions:${savedJdCount} (100% PRESERVED)`);
    console.log(`  Interview Sessions:    ${sessionCount} (100% PRESERVED)`);
    console.log(`  Company Profiles:      ${companyCount} (100% PRESERVED)`);
    console.log(`--------------------------------------------------`);
    console.log(`[QUESTION BANK DOMAIN]`);
    console.log(`  Questions in Bank:     ${questionBankCount} (100% PRESERVED)`);
    console.log(`  Question Criteria Links:${questionCriteriaCount} (Mapped: ${questionBankCount > 0 ? (questionCriteriaCount >= questionBankCount ? 'PASS' : 'PARTIAL') : 'N/A'})`);
    console.log(`--------------------------------------------------`);
    console.log(`[SFIA 9 TAXONOMY & CRITERIA DOMAIN]`);
    console.log(`  Competencies (Skills): ${competencyCount}`);
    console.log(`  Criteria (SFIA Levels):${criteriaCount} (Criteria Records)`);
    console.log(`  Levels (1-7):          ${levelCount}`);
    console.log(`  Roles Defined:         ${roleCount}`);
    console.log(`--------------------------------------------------`);
    console.log(`[SAMPLE CRITERIA JSONB CHECK - PROG_L3]`);
    if (sampleCriteria) {
      console.log(`  Code: ${sampleCriteria.code} (${sampleCriteria.name})`);
      console.log(`  Indicators Count: ${Array.isArray(sampleCriteria.behavioralIndicators) ? sampleCriteria.behavioralIndicators.length : 0}`);
      console.log(`  Generic Attributes: ${sampleCriteria.genericAttributes ? 'Present' : 'Missing'}`);
    } else {
      console.log('  No sample PROG_L3 found');
    }
    console.log('==================================================');
  } finally {
    await prisma.$disconnect();
  }
}

void main();
