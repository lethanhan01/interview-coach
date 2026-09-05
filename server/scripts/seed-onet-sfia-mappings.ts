import 'dotenv/config';
import { Client } from 'pg';
import { buildPgConnectionConfig } from '../src/infrastructure/database/prisma/db-timezone';

interface MappingItem {
  onetSocCode: string;
  sfiaSkillCode: string;
  targetSfiaLevel: number;
  defaultWeight: number;
  isCore: boolean;
  source: string;
}

const SEED_MAPPINGS: MappingItem[] = [
  // 1. 15-1252.00 (Software Developers)
  // Level 2 (Junior)
  {
    onetSocCode: '15-1252.00',
    sfiaSkillCode: 'PROG',
    targetSfiaLevel: 2,
    defaultWeight: 1.5,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1252.00',
    sfiaSkillCode: 'TEST',
    targetSfiaLevel: 2,
    defaultWeight: 1.0,
    isCore: true,
    source: 'curated',
  },
  // Level 3 (Middle)
  {
    onetSocCode: '15-1252.00',
    sfiaSkillCode: 'PROG',
    targetSfiaLevel: 3,
    defaultWeight: 1.5,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1252.00',
    sfiaSkillCode: 'DBDS',
    targetSfiaLevel: 3,
    defaultWeight: 1.2,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1252.00',
    sfiaSkillCode: 'TEST',
    targetSfiaLevel: 3,
    defaultWeight: 1.0,
    isCore: true,
    source: 'curated',
  },
  // Level 4 (Senior)
  {
    onetSocCode: '15-1252.00',
    sfiaSkillCode: 'PROG',
    targetSfiaLevel: 4,
    defaultWeight: 1.5,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1252.00',
    sfiaSkillCode: 'DBDS',
    targetSfiaLevel: 4,
    defaultWeight: 1.2,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1252.00',
    sfiaSkillCode: 'DESN',
    targetSfiaLevel: 4,
    defaultWeight: 1.2,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1252.00',
    sfiaSkillCode: 'ARCH',
    targetSfiaLevel: 4,
    defaultWeight: 1.0,
    isCore: false,
    source: 'curated',
  },

  // 2. 15-1244.00 (Network and Computer Systems Administrators / DevOps)
  // Level 2 (Junior)
  {
    onetSocCode: '15-1244.00',
    sfiaSkillCode: 'ITOP',
    targetSfiaLevel: 2,
    defaultWeight: 1.5,
    isCore: true,
    source: 'curated',
  },
  // Level 3 (Middle)
  {
    onetSocCode: '15-1244.00',
    sfiaSkillCode: 'ITOP',
    targetSfiaLevel: 3,
    defaultWeight: 1.5,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1244.00',
    sfiaSkillCode: 'HSIN',
    targetSfiaLevel: 3,
    defaultWeight: 1.2,
    isCore: true,
    source: 'curated',
  },
  // Level 4 (Senior)
  {
    onetSocCode: '15-1244.00',
    sfiaSkillCode: 'ITOP',
    targetSfiaLevel: 4,
    defaultWeight: 1.5,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1244.00',
    sfiaSkillCode: 'HSIN',
    targetSfiaLevel: 4,
    defaultWeight: 1.2,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1244.00',
    sfiaSkillCode: 'SCAD',
    targetSfiaLevel: 4,
    defaultWeight: 1.0,
    isCore: false,
    source: 'curated',
  },

  // 3. 15-1243.00 (Database Engineers)
  // Level 2 (Junior)
  {
    onetSocCode: '15-1243.00',
    sfiaSkillCode: 'DBDS',
    targetSfiaLevel: 2,
    defaultWeight: 1.5,
    isCore: true,
    source: 'curated',
  },
  // Level 3 (Middle)
  {
    onetSocCode: '15-1243.00',
    sfiaSkillCode: 'DBDS',
    targetSfiaLevel: 3,
    defaultWeight: 1.5,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1243.00',
    sfiaSkillCode: 'DBAD',
    targetSfiaLevel: 3,
    defaultWeight: 1.2,
    isCore: true,
    source: 'curated',
  },
  // Level 4 (Senior)
  {
    onetSocCode: '15-1243.00',
    sfiaSkillCode: 'DBDS',
    targetSfiaLevel: 4,
    defaultWeight: 1.5,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1243.00',
    sfiaSkillCode: 'DBAD',
    targetSfiaLevel: 4,
    defaultWeight: 1.5,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1243.00',
    sfiaSkillCode: 'DATA',
    targetSfiaLevel: 4,
    defaultWeight: 1.2,
    isCore: false,
    source: 'curated',
  },

  // 4. 15-1253.00 (Software Quality Assurance Analysts and Testers)
  // Level 2 (Junior)
  {
    onetSocCode: '15-1253.00',
    sfiaSkillCode: 'TEST',
    targetSfiaLevel: 2,
    defaultWeight: 1.5,
    isCore: true,
    source: 'curated',
  },
  // Level 3 (Middle)
  {
    onetSocCode: '15-1253.00',
    sfiaSkillCode: 'TEST',
    targetSfiaLevel: 3,
    defaultWeight: 1.5,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1253.00',
    sfiaSkillCode: 'PROG',
    targetSfiaLevel: 3,
    defaultWeight: 1.0,
    isCore: true,
    source: 'curated',
  },
  // Level 4 (Senior)
  {
    onetSocCode: '15-1253.00',
    sfiaSkillCode: 'TEST',
    targetSfiaLevel: 4,
    defaultWeight: 1.5,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1253.00',
    sfiaSkillCode: 'PROG',
    targetSfiaLevel: 4,
    defaultWeight: 1.2,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1253.00',
    sfiaSkillCode: 'QUAS',
    targetSfiaLevel: 4,
    defaultWeight: 1.0,
    isCore: false,
    source: 'curated',
  },

  // 5. 15-1212.00 (Information Security Analysts / Cyber Security)
  // Level 3 (Middle)
  {
    onetSocCode: '15-1212.00',
    sfiaSkillCode: 'CYBS',
    targetSfiaLevel: 3,
    defaultWeight: 1.5,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1212.00',
    sfiaSkillCode: 'ITOP',
    targetSfiaLevel: 3,
    defaultWeight: 1.0,
    isCore: true,
    source: 'curated',
  },
  // Level 4 (Senior)
  {
    onetSocCode: '15-1212.00',
    sfiaSkillCode: 'CYBS',
    targetSfiaLevel: 4,
    defaultWeight: 1.5,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1212.00',
    sfiaSkillCode: 'SCTY',
    targetSfiaLevel: 4,
    defaultWeight: 1.2,
    isCore: true,
    source: 'curated',
  },
  {
    onetSocCode: '15-1212.00',
    sfiaSkillCode: 'SCAD',
    targetSfiaLevel: 4,
    defaultWeight: 1.0,
    isCore: false,
    source: 'curated',
  },
];

async function main() {
  console.log('--- BẮT ĐẦU SEED PUBLIC.ONET_SFIA_MAPPINGS ---');
  const client = new Client(buildPgConnectionConfig(process.env.DATABASE_URL));
  await client.connect();

  try {
    await client.query('BEGIN');

    let insertedCount = 0;
    for (const item of SEED_MAPPINGS) {
      await client.query(
        `
        INSERT INTO public.onet_sfia_mappings (
          onet_soc_code,
          sfia_skill_code,
          target_sfia_level,
          default_weight,
          is_core,
          source,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (onet_soc_code, sfia_skill_code, target_sfia_level)
        DO UPDATE SET
          default_weight = EXCLUDED.default_weight,
          is_core = EXCLUDED.is_core,
          source = EXCLUDED.source;
      `,
        [
          item.onetSocCode,
          item.sfiaSkillCode,
          item.targetSfiaLevel,
          item.defaultWeight,
          item.isCore,
          item.source,
        ],
      );
      insertedCount++;
    }

    await client.query('COMMIT');
    console.log(`Đã seed thành công ${insertedCount} bản ghi onet_sfia_mappings!`);

    // Verify đếm số lượng
    const countRes = await client.query('SELECT count(*) as count FROM public.onet_sfia_mappings;');
    console.log(`Tổng số bản ghi hiện có trong onet_sfia_mappings: ${countRes.rows[0].count}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Lỗi khi seed onet_sfia_mappings, ROLLBACK:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
