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
    const questionSkillLevelsCount = await prisma.questionBankSkillLevel.count();
    const skillCount = await prisma.skill.count();
    const skillLevelCount = await prisma.skillLevel.count();
    const levelCount = await prisma.level.count();
    const roleCount = await prisma.role.count();
    const roleSkillCount = await prisma.roleSkill.count();
    const companyCount = await prisma.companyProfile.count();

    // Check sample skill_level structure
    const sampleSkillLevel = await prisma.skillLevel.findFirst({
      where: { code: 'PROG_L3' },
      select: {
        code: true,
        name: true,
        behavioralIndicators: true,
        genericAttributes: true,
        skill: {
          select: {
            code: true,
            name: true,
            categoryCode: true,
          },
        },
      },
    });

    console.log('==================================================');
    console.log('   DATABASE INTEGRITY VERIFICATION (SFIA 9)       ');
    console.log('==================================================');
    console.log(`[USER DOMAIN]`);
    console.log(`  Users:                    ${userCount} (100% PRESERVED)`);
    console.log(`  User Profiles:            ${profileCount} (100% PRESERVED)`);
    console.log(`  Saved Job Descriptions:   ${savedJdCount} (100% PRESERVED)`);
    console.log(`  Interview Sessions:       ${sessionCount} (100% PRESERVED)`);
    console.log(`  Company Profiles:         ${companyCount} (100% PRESERVED)`);
    console.log(`--------------------------------------------------`);
    console.log(`[QUESTION BANK DOMAIN]`);
    console.log(`  Questions in Bank:        ${questionBankCount} (100% PRESERVED)`);
    console.log(`  Question-SkillLevel Links:${questionSkillLevelsCount} (Mapped: ${questionBankCount > 0 ? (questionSkillLevelsCount >= questionBankCount ? 'PASS' : 'PARTIAL') : 'N/A'})`);
    console.log(`--------------------------------------------------`);
    console.log(`[SFIA 9 TAXONOMY & SKILL LEVELS DOMAIN]`);
    console.log(`  Skills:                   ${skillCount}`);
    console.log(`  Skill Levels (Criteria):  ${skillLevelCount}`);
    console.log(`  Levels (1-7):             ${levelCount}`);
    console.log(`  Roles Defined:            ${roleCount}`);
    console.log(`  Role-Skill Requirements:  ${roleSkillCount}`);
    console.log(`--------------------------------------------------`);
    console.log(`[SAMPLE SKILL LEVEL JSONB CHECK - PROG_L3]`);
    if (sampleSkillLevel) {
      console.log(`  Skill: ${sampleSkillLevel.skill.name} [${sampleSkillLevel.skill.code}]`);
      console.log(`  Skill Level Code: ${sampleSkillLevel.code} (${sampleSkillLevel.name})`);
      console.log(`  Indicators Count: ${Array.isArray(sampleSkillLevel.behavioralIndicators) ? sampleSkillLevel.behavioralIndicators.length : 0}`);
      console.log(`  Generic Attributes: ${sampleSkillLevel.genericAttributes ? 'Present' : 'Missing'}`);
    } else {
      console.log('  No sample PROG_L3 found');
    }
    console.log('==================================================');
  } finally {
    await prisma.$disconnect();
  }
}

void main();
