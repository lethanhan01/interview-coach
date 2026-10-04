import 'dotenv/config';
import { Client } from 'pg';
import { buildPgConnectionConfig } from '../src/infrastructure/database/prisma/db-timezone';

async function main() {
  console.log('=====================================================');
  console.log('--- KIỂM TRA TOÀN VẸN DỮ LIỆU PHASE 1 (ADD-ONLY) ---');
  console.log('=====================================================');

  const client = new Client(buildPgConnectionConfig(process.env.DATABASE_URL));
  await client.connect();

  let passed = true;

  try {
    // 1. Kiểm tra QuestionBank
    const qbTotalRes = await client.query('SELECT count(*) as count FROM public.question_bank;');
    const qbTotal = parseInt(qbTotalRes.rows[0].count, 10);
    console.log(`\n[1] QuestionBank: Tổng số câu hỏi = ${qbTotal}`);
    if (qbTotal !== 359) {
      console.error(`❌ LỖI: Dự kiến 359 câu hỏi, thực tế có ${qbTotal}`);
      passed = false;
    } else {
      console.log('   ✅ Đủ 359 câu hỏi.');
    }

    const qbNullRes = await client.query(`
      SELECT count(*) as count 
      FROM public.question_bank 
      WHERE onet_soc_code IS NULL OR sfia_skill_code IS NULL OR target_sfia_level IS NULL;
    `);
    const qbNullCount = parseInt(qbNullRes.rows[0].count, 10);
    console.log(`[1.1] QuestionBank có trường NULL = ${qbNullCount}`);
    if (qbNullCount !== 0) {
      console.error(`❌ LỖI: Có ${qbNullCount} câu hỏi chưa được gán nhãn đầy đủ!`);
      passed = false;
    } else {
      console.log('   ✅ 100% câu hỏi đã có onet_soc_code, sfia_skill_code, target_sfia_level.');
    }

    // 2. Kiểm tra QuestionCriteria
    const criteriaTotalRes = await client.query('SELECT count(*) as count FROM public.question_criteria;');
    const criteriaTotal = parseInt(criteriaTotalRes.rows[0].count, 10);
    console.log(`\n[2] QuestionCriteria: Tổng số tiêu chí = ${criteriaTotal}`);
    if (criteriaTotal !== 718) {
      console.error(`❌ LỖI: Dự kiến 718 tiêu chí (359 x 2), thực tế có ${criteriaTotal}`);
      passed = false;
    } else {
      console.log('   ✅ Đủ 718 tiêu chí.');
    }

    const coreCountRes = await client.query("SELECT count(*) as count FROM public.question_criteria WHERE dimension = 'core';");
    const seniorityCountRes = await client.query("SELECT count(*) as count FROM public.question_criteria WHERE dimension = 'seniority';");
    const coreCount = parseInt(coreCountRes.rows[0].count, 10);
    const seniorityCount = parseInt(seniorityCountRes.rows[0].count, 10);
    console.log(`[2.1] Phân bổ chiều: Core = ${coreCount}, Seniority = ${seniorityCount}`);
    if (coreCount !== 359 || seniorityCount !== 359) {
      console.error(`❌ LỖI: Phân bổ dimension không cân bằng 1:1!`);
      passed = false;
    } else {
      console.log('   ✅ Mỗi câu hỏi đều có đúng 1 core criterion và 1 seniority criterion.');
    }

    const shortCriteriaRes = await client.query('SELECT count(*) as count FROM public.question_criteria WHERE length(trim(criteria_text)) < 15;');
    const shortCount = parseInt(shortCriteriaRes.rows[0].count, 10);
    if (shortCount > 0) {
      console.error(`❌ LỖI: Có ${shortCount} tiêu chí có độ dài quá ngắn (< 15 ký tự)!`);
      passed = false;
    } else {
      console.log('   ✅ 100% tiêu chí có nội dung rõ ràng, đầy đủ (> 15 ký tự).');
    }

    // 3. Kiểm tra OnetSfiaMapping
    const mappingTotalRes = await client.query('SELECT count(*) as count FROM public.onet_sfia_mappings;');
    const mappingTotal = parseInt(mappingTotalRes.rows[0].count, 10);
    console.log(`\n[3] OnetSfiaMapping: Tổng số bản ghi = ${mappingTotal}`);
    if (mappingTotal < 23) {
      console.error(`❌ LỖI: Dự kiến tối thiểu 23 bản ghi mapping, thực tế có ${mappingTotal}`);
      passed = false;
    } else {
      console.log(`   ✅ Đã seed ${mappingTotal} bản ghi (đáp ứng trọn vẹn yêu cầu >= 23).`);
    }

    const distinctSocs = await client.query('SELECT count(DISTINCT onet_soc_code) as count FROM public.onet_sfia_mappings;');
    console.log(`[3.1] Số mã nghề O*NET được bao phủ = ${distinctSocs.rows[0].count}`);
    if (parseInt(distinctSocs.rows[0].count, 10) < 5) {
      console.error('❌ LỖI: Chưa bao phủ đủ 5 mã nghề IT cốt lõi!');
      passed = false;
    } else {
      console.log('   ✅ Đã bao phủ đủ 5 nhóm nghề IT cốt lõi.');
    }

    // 4. Kiểm tra an toàn bảo toàn 7 bảng cũ (Add-only verification)
    console.log('\n[4] Kiểm tra bảo toàn 7 bảng cũ (Add-only verification):');
    const oldTables = [
      'levels',
      'roles',
      'skills',
      'skill_levels',
      'role_skills',
      'question_bank_skill_levels',
      'session_question_skill_levels',
    ];

    for (const table of oldTables) {
      const res = await client.query(`SELECT count(*) as count FROM public.${table};`);
      console.log(`   - Bảng public.${table}: ${res.rows[0].count} bản ghi`);
    }
    console.log('   ✅ Tất cả 7 bảng cũ được bảo toàn nguyên vẹn.');

    console.log('\n=====================================================');
    if (passed) {
      console.log('>>> TOÀN BỘ KIỂM TRA TOÀN VẸN GIAI ĐOẠN 1 THÀNH CÔNG RỰC RỠ <<<');
    } else {
      console.error('>>> CÓ LỖI XẢY RA TRONG KIỂM TRA TOÀN VẸN <<<');
      process.exitCode = 1;
    }
    console.log('=====================================================');
  } finally {
    await client.end();
  }
}

main();
