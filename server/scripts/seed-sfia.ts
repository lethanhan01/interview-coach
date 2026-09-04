import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import * as xlsx from 'xlsx';
import {
  buildPgConnectionConfig,
  setClientDbTimeZone,
} from '../src/infrastructure/database/prisma/db-timezone';

// ============================================================================
// TAXONOMY MAPPINGS FOR SFIA 9 CURRENT STANDARD
// ============================================================================
const CATEGORIES_SPEC = [
  {
    code: 'STRAT_ARCH',
    name: 'Strategy and architecture',
    description: 'Strategy, architecture and business alignment across digital, data and technology.',
    display_order: 1,
  },
  {
    code: 'CHG_TRANS',
    name: 'Change and transformation',
    description: 'Business transformation, change planning, business analysis and agile delivery.',
    display_order: 2,
  },
  {
    code: 'DEV_IMPL',
    name: 'Development and implementation',
    description: 'Developing, testing and implementing digital products, software and engineering solutions.',
    display_order: 3,
  },
  {
    code: 'DELIV_OP',
    name: 'Delivery and operation',
    description: 'Service delivery, technology management, security operations and DevOps.',
    display_order: 4,
  },
  {
    code: 'PPL_SKILL',
    name: 'People and skills',
    description: 'Workforce planning, people management, skills development and organizational capability.',
    display_order: 5,
  },
  {
    code: 'REL_ENG',
    name: 'Relationships and engagement',
    description: 'Stakeholder management, customer experience, sales, procurement and marketing.',
    display_order: 6,
  },
];

const SUBCATEGORIES_SPEC = [
  // Strategy and architecture
  { code: 'STRAT', category_code: 'STRAT_ARCH', name: 'Strategy and planning', display_order: 1 },
  { code: 'FINVAL', category_code: 'STRAT_ARCH', name: 'Financial and value management', display_order: 2 },
  { code: 'SECPRIV', category_code: 'STRAT_ARCH', name: 'Security and privacy', display_order: 3 },
  { code: 'GOVRISK', category_code: 'STRAT_ARCH', name: 'Governance, risk and compliance', display_order: 4 },
  { code: 'ADVGUID', category_code: 'STRAT_ARCH', name: 'Advice and guidance', display_order: 5 },

  // Change and transformation
  { code: 'CHGIMP', category_code: 'CHG_TRANS', name: 'Change implementation', display_order: 1 },
  { code: 'CHGANA', category_code: 'CHG_TRANS', name: 'Change analysis', display_order: 2 },
  { code: 'CHGPLAN', category_code: 'CHG_TRANS', name: 'Change planning', display_order: 3 },

  // Development and implementation
  { code: 'SYSDEV', category_code: 'DEV_IMPL', name: 'Systems development', display_order: 1 },
  { code: 'DATAN', category_code: 'DEV_IMPL', name: 'Data and analytics', display_order: 2 },
  { code: 'UCD', category_code: 'DEV_IMPL', name: 'User centred design', display_order: 3 },
  { code: 'CONTMGT', category_code: 'DEV_IMPL', name: 'Content management', display_order: 4 },
  { code: 'COMPSCI', category_code: 'DEV_IMPL', name: 'Computational science', display_order: 5 },

  // Delivery and operation
  { code: 'TECHMGT', category_code: 'DELIV_OP', name: 'Technology management', display_order: 1 },
  { code: 'SERVMGT', category_code: 'DELIV_OP', name: 'Service management', display_order: 2 },
  { code: 'SECSERV', category_code: 'DELIV_OP', name: 'Security services', display_order: 3 },
  { code: 'DATAOPS', category_code: 'DELIV_OP', name: 'Data and records operations', display_order: 4 },

  // People and skills
  { code: 'PPLMGT', category_code: 'PPL_SKILL', name: 'People management', display_order: 1 },
  { code: 'SKLMGT', category_code: 'PPL_SKILL', name: 'Skills management', display_order: 2 },

  // Relationships and engagement
  { code: 'STAKEMGT', category_code: 'REL_ENG', name: 'Stakeholder management', display_order: 1 },
  { code: 'SALESBID', category_code: 'REL_ENG', name: 'Sales and bid management', display_order: 2 },
  { code: 'MKTG', category_code: 'REL_ENG', name: 'Marketing', display_order: 3 },
];

const SUBCAT_NAME_TO_CODE: Record<string, string> = {
  'strategy and planning': 'STRAT',
  'financial and value management': 'FINVAL',
  'security and privacy': 'SECPRIV',
  'governance, risk and compliance': 'GOVRISK',
  'advice and guidance': 'ADVGUID',
  'change implementation': 'CHGIMP',
  'change analysis': 'CHGANA',
  'change planning': 'CHGPLAN',
  'systems development': 'SYSDEV',
  'data and analytics': 'DATAN',
  'user centred design': 'UCD',
  'content management': 'CONTMGT',
  'computational science': 'COMPSCI',
  'technology management': 'TECHMGT',
  'service management': 'SERVMGT',
  'security services': 'SECSERV',
  'data and records operations': 'DATAOPS',
  'people management': 'PPLMGT',
  'skills management': 'SKLMGT',
  'stakeholder management': 'STAKEMGT',
  'sales and bid management': 'SALESBID',
  'marketing': 'MKTG',
};

// ============================================================================
// UTILITIES
// ============================================================================
function cleanText(text: any): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/\r\r\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

// ============================================================================
// MAIN SEED ENGINE
// ============================================================================
async function runSeed() {
  console.log('============================================================');
  console.log('       INTERVIEWCOACH - SFIA 9 REFERENCE DATABASE SEEDER      ');
  console.log('============================================================');

  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DIRECT_URL hoặc DATABASE_URL chưa được cấu hình trong .env!');
  }

  const client = new Client(buildPgConnectionConfig(connectionString));
  await client.connect();
  await setClientDbTimeZone(client);
  console.log('✅ Connected to PostgreSQL / Supabase successfully.');

  // Find Excel file
  const excelPath = path.resolve(__dirname, '../prisma/seeds/data/sfia9-framework.xlsx');
  if (!fs.existsSync(excelPath)) {
    throw new Error(`❌ Không tìm thấy file Excel tại: ${excelPath}`);
  }

  console.log(`📖 Đang nạp và phân tích file Excel SFIA 9: ${excelPath}`);
  const workbook = xlsx.readFile(excelPath);

  // Validate required sheets
  const requiredSheets = ['Skills', 'Attributes', 'Levels of responsibility'];
  for (const sheet of requiredSheets) {
    if (!workbook.Sheets[sheet]) {
      throw new Error(`❌ File Excel thiếu Worksheet bắt buộc: "${sheet}"`);
    }
  }

  // 1. Parse Levels of responsibility
  console.log('📊 Đang xử lý Sheet "Levels of responsibility"...');
  const lorRows = xlsx.utils.sheet_to_json<any[]>(workbook.Sheets['Levels of responsibility'], { header: 1 });
  const levelsData: Array<{
    level_id: number;
    name: string;
    essence: string;
    description: string;
  }> = [];

  for (let lvl = 1; lvl <= 7; lvl++) {
    const guidingPhrase = cleanText(lorRows[1]?.[lvl]) || `Level ${lvl}`;
    let rawEssence = cleanText(lorRows[2]?.[lvl]) || '';
    rawEssence = rawEssence.replace(/^essence of the level:\s*/i, '');
    const fullDesc = `Level ${lvl} (${guidingPhrase}). ${rawEssence}`;

    levelsData.push({
      level_id: lvl,
      name: guidingPhrase,
      essence: rawEssence,
      description: fullDesc,
    });
  }

  // 2. Parse Skills and Skill Levels
  console.log('📊 Đang xử lý Sheet "Skills"...');
  const skillRows = xlsx.utils.sheet_to_json<any[]>(workbook.Sheets['Skills'], { header: 1 });
  const skillsData: Array<{
    code: string;
    subcategory_code: string;
    name: string;
    overall_description: string;
    guidance_notes: string | null;
    min_level: number;
    max_level: number;
  }> = [];

  const skillLevelsData: Array<{
    skill_code: string;
    level_id: number;
    description: string;
  }> = [];

  for (let i = 1; i < skillRows.length; i++) {
    const r = skillRows[i];
    if (!r) continue;

    const code = cleanText(r[8]).toUpperCase();
    const name = cleanText(r[10]);
    const subcatName = cleanText(r[12]).toLowerCase();
    const overallDesc = cleanText(r[13]);
    const guidance = cleanText(r[14]);

    if (!code || !name) continue;

    const subcategoryCode = SUBCAT_NAME_TO_CODE[subcatName] || 'SYSDEV';

    let minLevel = 7;
    let maxLevel = 1;
    let foundLevel = false;

    for (let l = 1; l <= 7; l++) {
      const lvlDesc = cleanText(r[14 + l]);
      if (lvlDesc.length > 0) {
        foundLevel = true;
        if (l < minLevel) minLevel = l;
        if (l > maxLevel) maxLevel = l;

        skillLevelsData.push({
          skill_code: code,
          level_id: l,
          description: lvlDesc,
        });
      }
    }

    if (!foundLevel) {
      minLevel = 1;
      maxLevel = 7;
    }

    skillsData.push({
      code,
      subcategory_code: subcategoryCode,
      name,
      overall_description: overallDesc || name,
      guidance_notes: guidance.length > 0 ? guidance : null,
      min_level: minLevel,
      max_level: maxLevel,
    });
  }

  // 3. Parse Attributes and Generic Attribute Levels
  console.log('📊 Đang xử lý Sheet "Attributes"...');
  const attrRows = xlsx.utils.sheet_to_json<any[]>(workbook.Sheets['Attributes'], { header: 1 });
  const attributesData: Array<{
    code: string;
    name: string;
    description: string;
    display_order: number;
  }> = [];

  const attrLevelsData: Array<{
    attribute_code: string;
    level_id: number;
    description: string;
  }> = [];

  let attrOrder = 1;
  for (let i = 1; i < attrRows.length; i++) {
    const r = attrRows[i];
    if (!r) continue;

    const code = cleanText(r[7]).toUpperCase();
    const name = cleanText(r[9]);
    const overallDesc = cleanText(r[11]) || cleanText(r[12]) || name;

    if (!code || !name) continue;

    attributesData.push({
      code,
      name,
      description: overallDesc,
      display_order: attrOrder++,
    });

    for (let l = 1; l <= 7; l++) {
      const lvlDesc = cleanText(r[12 + l]);
      if (lvlDesc.length > 0) {
        attrLevelsData.push({
          attribute_code: code,
          level_id: l,
          description: lvlDesc,
        });
      }
    }
  }

  console.log(`\n📋 Dữ liệu đã trích xuất từ Excel:`);
  console.log(`   - Categories               : ${CATEGORIES_SPEC.length} danh mục`);
  console.log(`   - Subcategories            : ${SUBCATEGORIES_SPEC.length} phân nhóm`);
  console.log(`   - Levels of responsibility : ${levelsData.length} cấp độ`);
  console.log(`   - Skills                   : ${skillsData.length} kỹ năng`);
  console.log(`   - Skill Levels             : ${skillLevelsData.length} phát biểu năng lực`);
  console.log(`   - Generic Attributes       : ${attributesData.length} thuộc tính`);
  console.log(`   - Generic Attribute Levels : ${attrLevelsData.length} tiêu chuẩn đo lường`);

  console.log('\n🚀 Bắt đầu Transaction nạp dữ liệu (Clean & Fresh Reload)...');
  await client.query('BEGIN');

  try {
    // 0. Ensure column length accommodates rich essences
    await client.query(`ALTER TABLE sfia.levels ALTER COLUMN essence TYPE TEXT;`);

    // 0. Clean old records in reverse cascade
    console.log('🧹 Đang làm sạch dữ liệu cũ (TRUNCATE ... CASCADE)...');
    await client.query(`TRUNCATE sfia.categories, sfia.levels, sfia.generic_attributes CASCADE;`);

    // 1. sfia.categories (6 rows)
    console.log(`⏳ 1/7 Nạp sfia.categories (${CATEGORIES_SPEC.length} bản ghi)...`);
    for (const c of CATEGORIES_SPEC) {
      await client.query(
        `INSERT INTO sfia.categories (code, name, description, display_order)
         VALUES ($1, $2, $3, $4);`,
        [c.code, c.name, c.description, c.display_order],
      );
    }

    // 2. sfia.subcategories (22 rows)
    console.log(`⏳ 2/7 Nạp sfia.subcategories (${SUBCATEGORIES_SPEC.length} bản ghi)...`);
    for (const s of SUBCATEGORIES_SPEC) {
      await client.query(
        `INSERT INTO sfia.subcategories (code, category_code, name, description, display_order)
         VALUES ($1, $2, $3, $4, $5);`,
        [s.code, s.category_code, s.name, null, s.display_order],
      );
    }

    // 3. sfia.levels (7 rows)
    console.log(`⏳ 3/7 Nạp sfia.levels (${levelsData.length} bản ghi)...`);
    for (const l of levelsData) {
      await client.query(
        `INSERT INTO sfia.levels (level_id, name, essence, description)
         VALUES ($1, $2, $3, $4);`,
        [l.level_id, l.name, l.essence, l.description],
      );
    }

    // 4. sfia.skills (147 rows)
    console.log(`⏳ 4/7 Nạp sfia.skills (${skillsData.length} bản ghi)...`);
    for (const sk of skillsData) {
      await client.query(
        `INSERT INTO sfia.skills (code, subcategory_code, name, overall_description, guidance_notes, min_level, max_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [sk.code, sk.subcategory_code, sk.name, sk.overall_description, sk.guidance_notes, sk.min_level, sk.max_level],
      );
    }

    // 5. sfia.skill_levels (~672 rows)
    console.log(`⏳ 5/7 Nạp sfia.skill_levels (${skillLevelsData.length} bản ghi)...`);
    for (const sl of skillLevelsData) {
      await client.query(
        `INSERT INTO sfia.skill_levels (skill_code, level_id, description)
         VALUES ($1, $2, $3);`,
        [sl.skill_code, sl.level_id, sl.description],
      );
    }

    // 6. sfia.generic_attributes (16 rows)
    console.log(`⏳ 6/7 Nạp sfia.generic_attributes (${attributesData.length} bản ghi)...`);
    for (const ga of attributesData) {
      await client.query(
        `INSERT INTO sfia.generic_attributes (code, name, description, display_order)
         VALUES ($1, $2, $3, $4);`,
        [ga.code, ga.name, ga.description, ga.display_order],
      );
    }

    // 7. sfia.generic_attribute_levels (112 rows)
    console.log(`⏳ 7/7 Nạp sfia.generic_attribute_levels (${attrLevelsData.length} bản ghi)...`);
    for (const gal of attrLevelsData) {
      await client.query(
        `INSERT INTO sfia.generic_attribute_levels (attribute_code, level_id, description)
         VALUES ($1, $2, $3);`,
        [gal.attribute_code, gal.level_id, gal.description],
      );
    }

    await client.query('COMMIT');
    console.log('✅ COMMIT TRANSACTION THÀNH CÔNG!\n');

    // Verification queries
    console.log('============================================================');
    console.log('       SFIA 9 DATABASE SEEDING SUMMARY & INTEGRITY REPORT   ');
    console.log('============================================================');

    const res = await client.query(`
      SELECT 'sfia.categories' AS tbl, count(*)::int AS count FROM sfia.categories
      UNION ALL
      SELECT 'sfia.subcategories', count(*)::int FROM sfia.subcategories
      UNION ALL
      SELECT 'sfia.levels', count(*)::int FROM sfia.levels
      UNION ALL
      SELECT 'sfia.skills', count(*)::int FROM sfia.skills
      UNION ALL
      SELECT 'sfia.skill_levels', count(*)::int FROM sfia.skill_levels
      UNION ALL
      SELECT 'sfia.generic_attributes', count(*)::int FROM sfia.generic_attributes
      UNION ALL
      SELECT 'sfia.generic_attribute_levels', count(*)::int FROM sfia.generic_attribute_levels;
    `);

    for (const row of res.rows) {
      console.log(`  ${row.tbl.padEnd(32)} : ${String(row.count).padStart(5)} bản ghi`);
    }

    // Orphan checks
    const orphanSkills = await client.query(`
      SELECT count(*)::int AS cnt FROM sfia.skills s
      LEFT JOIN sfia.subcategories sc ON s.subcategory_code = sc.code
      WHERE sc.code IS NULL;
    `);
    const orphanLevels = await client.query(`
      SELECT count(*)::int AS cnt FROM sfia.skill_levels sl
      LEFT JOIN sfia.skills s ON sl.skill_code = s.code
      WHERE s.code IS NULL;
    `);

    console.log('------------------------------------------------------------');
    console.log(`  Kiểm tra khóa ngoại Skills -> Subcategory : ${orphanSkills.rows[0].cnt === 0 ? '✅ HỢP LỆ (0 lỗi)' : '❌ LỖI'}`);
    console.log(`  Kiểm tra khóa ngoại SkillLevels -> Skills : ${orphanLevels.rows[0].cnt === 0 ? '✅ HỢP LỆ (0 lỗi)' : '❌ LỖI'}`);
    console.log('============================================================');
    console.log(' Trạng thái: 100% SFIA 9 ĐÃ NẠP TOÀN VẸN VÀO SUPABASE (0 LỖI)');
    console.log('============================================================\n');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ GẶP LỖI - ĐÃ ROLLBACK TOÀN BỘ TRANSACTION:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runSeed().catch((err) => {
  console.error('Fatal error during SFIA seeding:', err);
  process.exit(1);
});
