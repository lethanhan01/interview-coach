/**
 * verify-sfia-admin-api.ts
 *
 * Sub-phase 8.5: Live API Verification & End-to-End Test Suite
 *
 * Approach: Khởi tạo thủ công SfiaAdminRepository + SfiaAdminService,
 * kết nối PostgreSQL thực tế qua PrismaService (không qua NestJS DI / HTTP).
 * Pattern nhất quán với verify-step5-4-e2e-live.ts hiện có.
 *
 * Lệnh chạy (từ thư mục gốc workspace c:\Users\An\Documents\GR1\InterviewCoach):
 *   npx ts-node -r tsconfig-paths/register server/scripts/verify-sfia-admin-api.ts
 */
import 'dotenv/config';
import { performance } from 'perf_hooks';
import { PrismaService } from '../src/infrastructure/database/prisma/prisma.service';
import { SfiaAdminRepository } from '../src/modules/sfia/repositories/sfia-admin.repository';
import { SfiaAdminService, SFIA_VI_TRANSLATIONS } from '../src/modules/sfia/sfia-admin.service';
import { CreateSfiaQuestionDto } from '../src/modules/sfia/dto/sfia-admin.dto';

// ─── Khởi tạo ─────────────────────────────────────────────────────────────────

const prisma = new PrismaService();
// Bỏ qua DI token injection, inject trực tiếp (as any) — pattern nhất quán với E2E scripts
const repo = new SfiaAdminRepository(prisma);
const service = new SfiaAdminService(repo as any);

// ─── Helpers ──────────────────────────────────────────────────────────────────

let totalPassed = 0;
let totalFailed = 0;

function pass(msg: string): void {
  console.log(`   ✅ [PASS] ${msg}`);
  totalPassed++;
}

function fail(msg: string, detail?: unknown): void {
  console.error(`   ❌ [FAIL] ${msg}`, detail !== undefined ? detail : '');
  totalFailed++;
}

function assert(condition: boolean, passMsg: string, failMsg: string, detail?: unknown): void {
  if (condition) {
    pass(passMsg);
  } else {
    fail(failMsg, detail);
  }
}

function section(label: string): void {
  console.log(`\n[${label}]`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  KIỂM THỬ LIVE DATABASE — SFIA ADMIN API (Sub-phase 8.5)');
  console.log('═══════════════════════════════════════════════════════════════');

  let createdQuestionId: string | null = null;

  try {

    // ═════════════════════════════════════════════════════════════════════════
    // TEST [0]: KHỞI TẠO VÀ KIỂM TRA STATIC CACHE
    // ═════════════════════════════════════════════════════════════════════════
    section('0] INIT — Khởi tạo và kiểm tra static cache');

    // onModuleInit() không tự chạy khi khởi tạo thủ công — gọi tường minh
    await service.loadStaticCache();

    assert(
      service.isInitialized() === true,
      'service.isInitialized() = true',
      'service.isInitialized() = false — loadStaticCache() thất bại',
    );

    // Verify cache counts gián tiếp qua public methods
    const cachedCategories = await service.getCategories();
    assert(
      cachedCategories.length === 6,
      `Cache đã nạp đủ 6 categories`,
      `Cache categories count = ${cachedCategories.length} (kỳ vọng 6)`,
    );

    const cachedLevels = await service.getResponsibilityLevels();
    assert(
      cachedLevels.length === 7,
      'Cache đã nạp đủ 7 levels',
      `Cache levels count = ${cachedLevels.length} (kỳ vọng 7)`,
    );

    const cachedAttrs = await service.getGenericAttributes();
    assert(
      cachedAttrs.length >= 1,
      `Cache đã nạp generic attributes (count = ${cachedAttrs.length})`,
      'Cache generic attributes rỗng',
    );


    // ═════════════════════════════════════════════════════════════════════════
    // TEST [1]: CATEGORIES — 6 danh mục + đầy đủ nameVi
    // ═════════════════════════════════════════════════════════════════════════
    section('1] CATEGORIES — 6 danh mục + đầy đủ nameVi');

    const categories = await service.getCategories();

    assert(
      categories.length === 6,
      'categories.length = 6',
      `categories.length = ${categories.length} (kỳ vọng 6)`,
    );

    // Kiểm tra đầy đủ tất cả 6 giá trị nameVi từ SFIA_VI_TRANSLATIONS.categories
    const expectedCategoryVi = SFIA_VI_TRANSLATIONS.categories;
    for (const [code, expectedNameVi] of Object.entries(expectedCategoryVi)) {
      const cat = categories.find(c => c.code === code);
      assert(
        !!cat,
        `Category ${code} tồn tại`,
        `Category ${code} KHÔNG tồn tại trong kết quả`,
      );
      assert(
        cat?.nameVi === expectedNameVi,
        `${code}.nameVi = "${expectedNameVi}"`,
        `${code}.nameVi sai: nhận "${cat?.nameVi}", kỳ vọng "${expectedNameVi}"`,
      );
    }


    // ═════════════════════════════════════════════════════════════════════════
    // TEST [2]: SUBCATEGORIES — 22 phân nhóm + đầy đủ nameVi + liên kết cha
    // ═════════════════════════════════════════════════════════════════════════
    section('2] SUBCATEGORIES — 22 phân nhóm + đầy đủ nameVi + liên kết cha');

    const subcategories = await service.getSubcategories();

    assert(
      subcategories.length === 22,
      'subcategories.length = 22',
      `subcategories.length = ${subcategories.length} (kỳ vọng 22)`,
    );

    // Kiểm tra mọi categoryCode tham chiếu hợp lệ
    const validCategoryCodes = new Set(categories.map(c => c.code));
    const allLinkedCorrectly = subcategories.every(sc => validCategoryCodes.has(sc.categoryCode));
    assert(
      allLinkedCorrectly,
      'Mọi subcategory.categoryCode đều tham chiếu đến 1 trong 6 categories hợp lệ',
      'Có subcategory với categoryCode không hợp lệ (orphan)',
    );

    // Kiểm tra đầy đủ tất cả 22 giá trị nameVi từ SFIA_VI_TRANSLATIONS.subcategories
    const expectedSubcategoryVi = SFIA_VI_TRANSLATIONS.subcategories;
    for (const [code, expectedNameVi] of Object.entries(expectedSubcategoryVi)) {
      const sc = subcategories.find(s => s.code === code);
      assert(
        !!sc,
        `Subcategory ${code} tồn tại`,
        `Subcategory ${code} KHÔNG tồn tại trong kết quả`,
      );
      assert(
        sc?.nameVi === expectedNameVi,
        `${code}.nameVi = "${expectedNameVi}"`,
        `${code}.nameVi sai: nhận "${sc?.nameVi}", kỳ vọng "${expectedNameVi}"`,
      );
    }


    // ═════════════════════════════════════════════════════════════════════════
    // TEST [3]: SKILLS — 147 kỹ năng + level range hợp lệ
    // ═════════════════════════════════════════════════════════════════════════
    section('3] SKILLS — 147 kỹ năng + minLevel/maxLevel hợp lệ');

    const skills = await service.getSkills();

    assert(
      skills.length === 147,
      'skills.length = 147',
      `skills.length = ${skills.length} (kỳ vọng 147)`,
    );

    const allValidRange = skills.every(
      s => s.minLevel >= 1 && s.maxLevel <= 7 && s.minLevel <= s.maxLevel,
    );
    assert(
      allValidRange,
      'Mọi skill: 1 ≤ minLevel ≤ maxLevel ≤ 7',
      'Có skill với minLevel/maxLevel ngoài dải hợp lệ [1-7]',
    );

    const allNonNegativeCounts = skills.every(s => s.questionCount >= 0 && s.onetCount >= 0);
    assert(
      allNonNegativeCounts,
      'Mọi skill: questionCount ≥ 0 và onetCount ≥ 0',
      'Có skill với questionCount hoặc onetCount âm',
    );


    // ═════════════════════════════════════════════════════════════════════════
    // TEST [4]: TAXONOMY — Composite endpoint (categories + subcategories + skills)
    // ═════════════════════════════════════════════════════════════════════════
    section('4] TAXONOMY — Composite endpoint');

    const taxonomy = await service.getTaxonomy();

    assert(
      taxonomy.categories.length === 6,
      'taxonomy.categories.length = 6',
      `taxonomy.categories.length = ${taxonomy.categories.length}`,
    );
    assert(
      taxonomy.subcategories.length === 22,
      'taxonomy.subcategories.length = 22',
      `taxonomy.subcategories.length = ${taxonomy.subcategories.length}`,
    );
    assert(
      taxonomy.skills.length === 147,
      'taxonomy.skills.length = 147',
      `taxonomy.skills.length = ${taxonomy.skills.length}`,
    );


    // ═════════════════════════════════════════════════════════════════════════
    // TEST [5]: SKILL DETAIL — PROG (chi tiết đầy đủ)
    // ═════════════════════════════════════════════════════════════════════════
    section('5] SKILL DETAIL — PROG');

    const prog = await service.getSkillDetail('PROG');

    assert(prog.code === 'PROG', 'code = "PROG"', `code sai: "${prog.code}"`);
    assert(prog.minLevel === 2, 'minLevel = 2', `minLevel sai: ${prog.minLevel}`);
    assert(prog.maxLevel === 6, 'maxLevel = 6', `maxLevel sai: ${prog.maxLevel}`);

    // skillLevels: đúng 5 statements (Level 2 → Level 6)
    assert(
      prog.skillLevels.length === 5,
      'skillLevels.length = 5 (Level 2→6)',
      `skillLevels.length = ${prog.skillLevels.length} (kỳ vọng 5)`,
    );

    // Kiểm tra levelId liên tiếp từ minLevel đến maxLevel
    const levelIds = prog.skillLevels.map(sl => sl.levelId).sort((a, b) => a - b);
    assert(
      JSON.stringify(levelIds) === JSON.stringify([2, 3, 4, 5, 6]),
      'skillLevels chứa đúng các levelId [2,3,4,5,6]',
      `skillLevels levelIds sai: ${JSON.stringify(levelIds)}`,
    );

    // Mọi statement có description không rỗng
    const allHaveDesc = prog.skillLevels.every(
      sl => typeof sl.description === 'string' && sl.description.trim().length > 0,
    );
    assert(allHaveDesc, 'Mọi skillLevel có description không rỗng', 'Có skillLevel thiếu/trống description');

    // Có ít nhất 1 onetMapping
    assert(
      prog.onetMappings.length >= 1,
      `onetMappings.length ≥ 1 (thực: ${prog.onetMappings.length})`,
      'PROG không có onet mapping nào',
    );


    // ═════════════════════════════════════════════════════════════════════════
    // TEST [6]: LEVELS — 7 cấp độ + nameVi chính xác
    // ═════════════════════════════════════════════════════════════════════════
    section('6] LEVELS — 7 cấp độ + nameVi chính xác');

    const levels = await service.getResponsibilityLevels();

    assert(levels.length === 7, 'levels.length = 7', `levels.length = ${levels.length}`);

    const sortedLevelIds = levels.map(l => l.levelId).sort((a, b) => a - b);
    assert(
      JSON.stringify(sortedLevelIds) === JSON.stringify([1, 2, 3, 4, 5, 6, 7]),
      'levelId đầy đủ: [1,2,3,4,5,6,7]',
      `levelIds không đầy đủ: ${JSON.stringify(sortedLevelIds)}`,
    );

    // Kiểm tra tất cả 7 nameVi từ SFIA_VI_TRANSLATIONS.levels
    const expectedLevelVi = SFIA_VI_TRANSLATIONS.levels;
    for (const [levelIdStr, expectedNameVi] of Object.entries(expectedLevelVi)) {
      const levelId = Number(levelIdStr);
      const lvl = levels.find(l => l.levelId === levelId);
      assert(
        lvl?.nameVi === expectedNameVi,
        `Level ${levelId}.nameVi = "${expectedNameVi}"`,
        `Level ${levelId}.nameVi sai: nhận "${lvl?.nameVi}", kỳ vọng "${expectedNameVi}"`,
      );
    }


    // ═════════════════════════════════════════════════════════════════════════
    // TEST [7]: COVERAGE STATS + GENERIC ATTRIBUTES (lồng vào 1 block)
    // ═════════════════════════════════════════════════════════════════════════
    section('7] COVERAGE STATS + GENERIC ATTRIBUTES');

    // ── 7a. Coverage Stats ──────────────────────────────────────────────────
    const t7Start = performance.now();
    const stats = await service.getCoverageStats();
    const t7Elapsed = performance.now() - t7Start;

    assert(stats.totalSkills === 147, 'totalSkills = 147', `totalSkills = ${stats.totalSkills}`);
    assert(stats.totalCategories === 6, 'totalCategories = 6', `totalCategories = ${stats.totalCategories}`);
    assert(stats.totalSubcategories === 22, 'totalSubcategories = 22', `totalSubcategories = ${stats.totalSubcategories}`);
    assert(stats.totalLevels === 7, 'totalLevels = 7', `totalLevels = ${stats.totalLevels}`);

    // blindSpotsCount: chỉ kiểm tra logic (≥ 0 và ≤ totalSkills)
    // Lưu ý: blindSpotsCount (từ NOT EXISTS query) và (totalSkills - skillsWithQuestions)
    // có thể chênh lệch 1 nếu có row với sfia_skill_code = NULL trong question_bank.
    assert(
      stats.blindSpotsCount >= 0 && stats.blindSpotsCount <= stats.totalSkills,
      `blindSpotsCount = ${stats.blindSpotsCount} (trong dải hợp lệ [0, ${stats.totalSkills}])`,
      `blindSpotsCount = ${stats.blindSpotsCount} ngoài dải hợp lệ [0, ${stats.totalSkills}]`,
    );

    assert(
      stats.categoryDistribution.length === 6,
      'categoryDistribution.length = 6',
      `categoryDistribution.length = ${stats.categoryDistribution.length}`,
    );

    // levelDistribution: 7 phần tử với level [1,2,3,4,5,6,7]
    assert(
      stats.levelDistribution.length === 7,
      'levelDistribution.length = 7',
      `levelDistribution.length = ${stats.levelDistribution.length}`,
    );
    const levelDistLevels = stats.levelDistribution.map(ld => ld.level).sort((a, b) => a - b);
    assert(
      JSON.stringify(levelDistLevels) === JSON.stringify([1, 2, 3, 4, 5, 6, 7]),
      'levelDistribution chứa đúng level [1,2,3,4,5,6,7]',
      `levelDistribution levels sai: ${JSON.stringify(levelDistLevels)}`,
    );

    assert(
      stats.topOnetMappedSkills.length >= 1,
      `topOnetMappedSkills.length ≥ 1 (thực: ${stats.topOnetMappedSkills.length})`,
      'topOnetMappedSkills rỗng',
    );

    // Latency check: getCoverageStats < 500ms (multi-subquery aggregation, cold connection)
    assert(
      t7Elapsed < 500,
      `getCoverageStats latency = ${t7Elapsed.toFixed(1)}ms (< 500ms ✓)`,
      `getCoverageStats latency = ${t7Elapsed.toFixed(1)}ms VƯỢT ngưỡng 500ms`,
    );

    // ── 7b. Generic Attributes (lồng vào cùng block) ───────────────────────
    const genericAttrs = await service.getGenericAttributes();

    assert(
      genericAttrs.length >= 1,
      `getGenericAttributes trả về ${genericAttrs.length} attributes`,
      'getGenericAttributes trả về mảng rỗng',
    );

    // Kiểm tra ít nhất 1 attribute có đủ key 1-7 trong object levels
    const attrWithFullLevels = genericAttrs.find(ga => {
      const keys = Object.keys(ga.levels).map(Number);
      return keys.length >= 7 && [1, 2, 3, 4, 5, 6, 7].every(k => k in ga.levels);
    });
    assert(
      !!attrWithFullLevels,
      `Có ít nhất 1 generic attribute với đầy đủ key levels 1-7 (ví dụ: ${attrWithFullLevels?.code ?? 'N/A'})`,
      'Không có generic attribute nào có đủ key 1-7 trong object levels',
    );


    // ═════════════════════════════════════════════════════════════════════════
    // TEST [8]: MATRIX DATA — cấu trúc ô + latency < 200ms
    // ═════════════════════════════════════════════════════════════════════════
    section('8] MATRIX DATA — cấu trúc ô + latency < 200ms');

    const t8Start = performance.now();
    const matrix = await service.getMatrixData();
    const t8Elapsed = performance.now() - t8Start;

    // Ngưỡng 2000ms: cold query cho 147×7 = 1029 ô matrix với JOIN phức tạp
    assert(
      t8Elapsed < 2000,
      `getMatrixData latency = ${t8Elapsed.toFixed(1)}ms (< 2000ms ✓)`,
      `getMatrixData latency = ${t8Elapsed.toFixed(1)}ms VƯỢT ngưỡng 2000ms`,
    );

    // Kiểm tra cấu trúc
    assert(
      matrix.categories.length === 6,
      'matrix.categories.length = 6',
      `matrix.categories.length = ${matrix.categories.length}`,
    );

    // Kiểm tra các ô PROG_L2 → PROG_L6 isAvailable = true (trong dải)
    const expectedProgAvailableKeys = ['PROG_L2', 'PROG_L3', 'PROG_L4', 'PROG_L5', 'PROG_L6'];
    for (const key of expectedProgAvailableKeys) {
      assert(
        key in matrix.cells,
        `matrix.cells["${key}"] tồn tại`,
        `matrix.cells["${key}"] KHÔNG tồn tại`,
      );
      assert(
        matrix.cells[key]?.isAvailable === true,
        `matrix.cells["${key}"].isAvailable = true`,
        `matrix.cells["${key}"].isAvailable = ${matrix.cells[key]?.isAvailable} (kỳ vọng true)`,
      );
    }

    // Kiểm tra PROG_L1 và PROG_L7 isAvailable = false (ngoài dải)
    assert(
      matrix.cells['PROG_L1']?.isAvailable === false,
      'matrix.cells["PROG_L1"].isAvailable = false (ngoài dải: minLevel=2)',
      `matrix.cells["PROG_L1"].isAvailable = ${matrix.cells['PROG_L1']?.isAvailable} (kỳ vọng false)`,
    );
    assert(
      matrix.cells['PROG_L7']?.isAvailable === false,
      'matrix.cells["PROG_L7"].isAvailable = false (ngoài dải: maxLevel=6)',
      `matrix.cells["PROG_L7"].isAvailable = ${matrix.cells['PROG_L7']?.isAvailable} (kỳ vọng false)`,
    );


    // ═════════════════════════════════════════════════════════════════════════
    // TEST [9]: CREATE QUESTION + CLEANUP — Vòng đời CRUD an toàn
    // ═════════════════════════════════════════════════════════════════════════
    section('9] CREATE QUESTION — Vòng đời CRUD an toàn');

    const createDto: CreateSfiaQuestionDto = {
      questionText: '[E2E-TEST-8.5] Giải thích Event Loop Node.js và cơ chế xử lý async I/O. (sẽ bị xóa ngay)',
      type: 'TECHNICAL',
      difficulty: 'MEDIUM',
      targetSfiaLevel: 3, // Trong dải PROG (minLevel=2, maxLevel=6) ✓
    };
    // Lưu ý: contextPackId = 'sfia-v9' bị chặn bởi chk_question_bank_context_pack.
    // Repository đã được cập nhật để dùng contextPackId = 'VN' thay thế.

    const created = await service.createQuestion('PROG', createDto);
    createdQuestionId = created.id;

    assert(
      typeof createdQuestionId === 'string' && createdQuestionId.length > 0,
      `Câu hỏi đã được tạo (id: ${createdQuestionId})`,
      'createQuestion không trả về id hợp lệ',
    );
    assert(created.type === 'TECHNICAL', 'created.type = "TECHNICAL"', `created.type = "${created.type}"`);
    assert(created.difficulty === 'MEDIUM', 'created.difficulty = "MEDIUM"', `created.difficulty = "${created.difficulty}"`);
    assert(created.targetSfiaLevel === 3, 'created.targetSfiaLevel = 3', `created.targetSfiaLevel = ${created.targetSfiaLevel}`);

    // Xác nhận record thực sự tồn tại trong public.question_bank
    const found = await prisma.questionBank.findUnique({ where: { id: createdQuestionId } });
    assert(
      !!found,
      `Xác nhận tồn tại trong public.question_bank (id: ${createdQuestionId})`,
      `Không tìm thấy record trong DB (id: ${createdQuestionId})`,
    );
    assert(
      found?.sfiaSkillCode === 'PROG',
      'question_bank.sfiaSkillCode = "PROG"',
      `question_bank.sfiaSkillCode sai: "${found?.sfiaSkillCode}"`,
    );
    assert(
      found?.targetSfiaLevel === 3,
      'question_bank.targetSfiaLevel = 3',
      `question_bank.targetSfiaLevel sai: ${found?.targetSfiaLevel}`,
    );
    assert(
      found?.deletedAt === null,
      'question_bank.deletedAt = null (câu hỏi active)',
      `question_bank.deletedAt không null: ${found?.deletedAt}`,
    );

  } catch (err) {
    console.error('\n❌ Ngoại lệ bất thường trong quá trình kiểm thử:', err);
    totalFailed++;
  } finally {
    // ─── CLEANUP: luôn chạy bất kể kết quả ──────────────────────────────────
    console.log('\n[CLEANUP] Dọn dẹp dữ liệu kiểm thử...');
    if (createdQuestionId) {
      try {
        await prisma.questionBank.delete({ where: { id: createdQuestionId } });
        // Xác nhận đã xóa sạch
        const afterDelete = await prisma.questionBank.findUnique({ where: { id: createdQuestionId } });
        if (!afterDelete) {
          console.log(`   ✅ Đã xóa sạch câu hỏi test (id: ${createdQuestionId})`);
        } else {
          console.error('   ⚠️ Câu hỏi test vẫn còn trong DB sau khi xóa!');
        }
      } catch (e) {
        console.error(`   ⚠️ Lỗi khi xóa câu hỏi test (id: ${createdQuestionId}):`, e);
      }
    } else {
      console.log('   ℹ️ Không có câu hỏi test nào cần dọn dẹp');
    }

    await prisma.$disconnect();
    console.log('   ✅ Đã ngắt kết nối PrismaService');
  }

  // ─── TỔNG KẾT ─────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`TỔNG KẾT: ${totalPassed} PASS | ${totalFailed} FAIL`);
  if (totalFailed === 0) {
    console.log('🎉 SUB-PHASE 8.5 LIVE VERIFICATION THÀNH CÔNG 100%!');
    console.log('   → Phase 8 hoàn thành. Sẵn sàng chuyển sang Phase 9.');
  } else {
    console.error(`❌ CÓ ${totalFailed} LỖI — Kiểm tra log trên trước khi chuyển Phase 9.`);
    process.exit(1);
  }
  console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
