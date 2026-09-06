import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaService } from '../src/infrastructure/database/prisma/prisma.service';

const prisma = new PrismaService();

function mapJdLevelToSfia(level?: string | null): number | null {
  if (!level) return null;
  const normalized = level.trim().toLowerCase();
  switch (normalized) {
    case 'intern':
      return 1;
    case 'fresher':
    case 'junior':
      return 2;
    case 'middle':
      return 3;
    case 'senior':
      return 4;
    case 'lead':
    case 'principal':
      return 5;
    default:
      return 3;
  }
}

async function findOnetMatch(title: string): Promise<{ socCode: string; title: string } | null> {
  const cleanTitle = title.trim();
  if (!cleanTitle) return null;

  try {
    // 1. Exact match on occupation_data
    const exact = await prisma.$queryRaw<Array<{ socCode: string; title: string }>>`
      SELECT onetsoc_code AS "socCode", title
      FROM onet.occupation_data
      WHERE LOWER(title) = LOWER(${cleanTitle})
      LIMIT 1;
    `;
    if (exact.length > 0) return exact[0];

    // 2. Exact match on alternate job_titles
    const altExact = await prisma.$queryRaw<Array<{ socCode: string; title: string }>>`
      SELECT jt.onetsoc_code AS "socCode", occ.title
      FROM onet.job_titles jt
      JOIN onet.occupation_data occ ON jt.onetsoc_code = occ.onetsoc_code
      WHERE LOWER(jt.job_title) = LOWER(${cleanTitle})
      LIMIT 1;
    `;
    if (altExact.length > 0) return altExact[0];

    // 3. Fuzzy search on job_titles
    const fuzzy = await prisma.$queryRaw<Array<{ socCode: string; title: string }>>`
      SELECT jt.onetsoc_code AS "socCode", occ.title
      FROM onet.job_titles jt
      JOIN onet.occupation_data occ ON jt.onetsoc_code = occ.onetsoc_code
      WHERE jt.job_title ILIKE ${`%${cleanTitle}%`} OR occ.title ILIKE ${`%${cleanTitle}%`}
      ORDER BY similarity(jt.job_title, ${cleanTitle}) DESC
      LIMIT 1;
    `;
    if (fuzzy.length > 0) return fuzzy[0];

    // Default fallback for general developers
    return { socCode: '15-1252.00', title: 'Software Developers' };
  } catch (err) {
    console.error(`Error matching O*NET for "${cleanTitle}":`, err);
    return null;
  }
}

async function main() {
  console.log('=== Starting Candidate Profiles O*NET / SFIA Migration ===');
  const profiles = await prisma.userProfile.findMany({
    where: {
      targetPosition: { not: null },
      onetSocCode: null,
    },
    select: {
      id: true,
      userId: true,
      targetPosition: true,
      targetLevel: true,
    },
  });

  console.log(`Found ${profiles.length} user profile(s) needing migration.`);

  let updatedCount = 0;
  for (const profile of profiles) {
    if (!profile.targetPosition) continue;

    const match = await findOnetMatch(profile.targetPosition);
    const sfiaLevel = mapJdLevelToSfia(profile.targetLevel);

    if (match) {
      await prisma.userProfile.update({
        where: { id: profile.id },
        data: {
          onetSocCode: match.socCode,
          onetOccupationTitle: match.title,
          targetSfiaLevel: sfiaLevel,
        },
      });
      console.log(
        `✓ Profile [${profile.id}] (${profile.targetPosition}) -> O*NET: ${match.title} [${match.socCode}], SFIA: ${sfiaLevel}`
      );
      updatedCount++;
    }
  }

  console.log(`=== Migration Completed: ${updatedCount}/${profiles.length} profiles backfilled successfully ===`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
