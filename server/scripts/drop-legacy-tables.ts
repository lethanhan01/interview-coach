import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment.');
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('=== BƯỚC 5.5: DỌN DẸP 7 BẢNG CŨ TRÊN POSTGRESQL ===\n');

  try {
    const legacyTables = [
      'session_question_skill_levels',
      'question_bank_skill_levels',
      'role_skills',
      'skill_levels',
      'roles',
      'levels',
      'skills',
    ];

    console.log('1. Đang kiểm tra sự tồn tại của 7 bảng cũ trong public schema:');
    const existingTables: { table_name: string }[] = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = ANY($1::text[])
    `, legacyTables);

    console.log(`- Các bảng cũ hiện có trong CSDL:`, existingTables.map(t => t.table_name));

    console.log('\n2. Đang thực thi lệnh DROP TABLE IF EXISTS ... CASCADE:');
    for (const table of legacyTables) {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "public"."${table}" CASCADE;`);
      console.log(`  ✔ Đã drop bảng: public.${table}`);
    }

    console.log('\n3. Kiểm tra lại sau khi drop:');
    const remainingTables: { table_name: string }[] = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = ANY($1::text[])
    `, legacyTables);

    if (remainingTables.length === 0) {
      console.log('  ✔ XÁC NHẬN: 100% (7/7) bảng cũ đã được dọn dẹp sạch sẽ khỏi PostgreSQL.');
    } else {
      console.error('  ❌ CẢNH BÁO: Còn sót lại các bảng:', remainingTables.map(t => t.table_name));
      process.exit(1);
    }

    console.log('\n=== HOÀN TẤT DỌN DẸP 7 BẢNG CŨ THÀNH CÔNG RỰC RỠ ===');
  } catch (error) {
    console.error('Lỗi trong quá trình dọn dẹp bảng cũ:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
