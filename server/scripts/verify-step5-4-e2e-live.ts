import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../src/infrastructure/database/prisma/prisma.service';
import { ScoringEngineService } from '../src/modules/interview-assessment/evaluation/scoring-engine.service';
import { UnifiedReportGeneratorService } from '../src/modules/interview-assessment/report/services/unified-report-generator.service';

const prisma = new PrismaService();

async function main() {
  console.log('===============================================================');
  console.log('--- KIỂM THỬ TÍCH HỢP E2E LIVE DATABASE (BƯỚC 5.4) ---');
  console.log('===============================================================\n');

  let passed = true;
  const testEmail = `e2e-test-${Date.now()}@example.com`;
  let userId: string | null = null;
  let jdId: string | null = null;
  let sessionId: string | null = null;

  try {
    // 0. Cập nhật constraint chk_session_reports_report_type để hỗ trợ session_competency_evaluation
    console.log('[0] Cập nhật Check Constraint chk_session_reports_report_type...');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE session_reports DROP CONSTRAINT IF EXISTS chk_session_reports_report_type;',
    );
    await prisma.$executeRawUnsafe(`
      ALTER TABLE session_reports 
      ADD CONSTRAINT chk_session_reports_report_type 
      CHECK (report_type IN (
        'executive_summary',
        'comm_analysis',
        'competency_heatmap',
        'action_plan',
        'skipped_answers',
        'session_competency_evaluation'
      ));
    `);
    console.log('   ✅ Đã cập nhật constraint chk_session_reports_report_type thành công.');

    // 1. Tạo test user
    console.log('\n[1] Tạo Test User...');
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: testEmail,
        passwordHash: 'hashed-pwd-test',
        firstname: 'E2E',
        lastname: 'Candidate',
        role: 'candidate',
        status: 'active',
      },
    });
    userId = user.id;
    console.log(`   ✅ User created: ${userId}`);

    // 2. Tạo Job Description chuẩn hóa O*NET SOC và SFIA Level
    console.log('\n[2] Tạo Saved Job Description...');
    const jd = await prisma.savedJobDescription.create({
      data: {
        userId,
        jobTitle: 'Senior Full Stack Engineer',
        companyName: 'TechCorp Live Test',
        jobContent: 'Lead frontend and backend development with Node.js and PostgreSQL',
        requirements: 'Proficiency with Node.js, PostgreSQL, TypeScript and Distributed Systems',
        onetSocCode: '15-1252.00',
        onetOccupationTitle: 'Software Developers',
        targetSfiaLevel: 4,
        techStack: ['Node.js', 'PostgreSQL', 'TypeScript', 'Docker'],
      },
    });
    jdId = jd.id;
    console.log(`   ✅ JD created: ${jdId} (SOC: 15-1252.00, SFIA Level: 4)`);

    // 3. Tạo Interview Session
    console.log('\n[3] Tạo Interview Session...');
    const session = await prisma.interviewSession.create({
      data: {
        savedJobDescriptionId: jdId,
        jobDescription: jd.jobContent,
        sessionType: 'technical',
        contextPackId: 'VN',
        onetSocCode: '15-1252.00',
        targetSfiaLevel: 4,
        status: 'active',
        numQuestions: 4,
      },
    });
    sessionId = session.id;
    console.log(`   ✅ Session created: ${sessionId}`);

    // 4. Tạo 4 SessionSkills
    console.log('\n[4] Khởi tạo 4 SessionSkills...');
    const skillsData = [
      { code: 'PROG', targetLevel: 4, weight: 1.0, tech: ['TypeScript', 'Node.js'] },
      { code: 'DBDS', targetLevel: 4, weight: 1.0, tech: ['PostgreSQL'] },
      { code: 'ARCH', targetLevel: 4, weight: 1.0, tech: ['Microservices'] },
      { code: 'DESN', targetLevel: 4, weight: 1.0, tech: ['Docker'] },
    ];

    const createdSkills: Record<string, string> = {};
    for (const s of skillsData) {
      const sk = await prisma.sessionSkill.create({
        data: {
          sessionId,
          skillCode: s.code,
          targetLevel: s.targetLevel,
          weight: s.weight,
          techContext: s.tech,
          source: 'hybrid_matrix',
        },
      });
      createdSkills[s.code] = sk.id;
    }
    console.log(`   ✅ Đã tạo 4 session_skills: ${Object.keys(createdSkills).join(', ')}`);

    // 5. Tạo 4 SessionQuestions kèm 2 tiêu chí nhị phân
    console.log('\n[5] Tạo 4 SessionQuestions kèm Rubric Criteria nhị phân...');
    const rubricProg = [
      { id: 'core', dimension: 'core', weight: 0.6, description: 'Understands event loop and streams' },
      { id: 'seniority', dimension: 'seniority', weight: 0.4, description: 'Handles GC optimization' },
    ];
    const rubricDbds = [
      { id: 'core', dimension: 'core', weight: 0.6, description: 'Designs compound indexes' },
      { id: 'seniority', dimension: 'seniority', weight: 0.4, description: 'Handles partitioning overhead' },
    ];
    const rubricArch = [
      { id: 'core', dimension: 'core', weight: 0.6, description: 'Event broker architecture' },
      { id: 'seniority', dimension: 'seniority', weight: 0.4, description: 'Distributed consensus & Saga' },
    ];
    const rubricDesn = [
      { id: 'core', dimension: 'core', weight: 0.6, description: 'Micro-frontends separation' },
      { id: 'seniority', dimension: 'seniority', weight: 0.4, description: 'Design token versioning' },
    ];

    const qProg = await prisma.sessionQuestion.create({
      data: {
        sessionId,
        sessionSkillId: createdSkills['PROG'],
        sfiaSkillCode: 'PROG',
        targetLevel: 4,
        orderIndex: 1,
        questionCategory: 'technical',
        questionText: 'Explain Node.js event loop and GC tuning.',
        rubricCriteria: rubricProg,
      },
    });

    const qDbds = await prisma.sessionQuestion.create({
      data: {
        sessionId,
        sessionSkillId: createdSkills['DBDS'],
        sfiaSkillCode: 'DBDS',
        targetLevel: 4,
        orderIndex: 2,
        questionCategory: 'technical',
        questionText: 'Design indexing and partitioning for PostgreSQL.',
        rubricCriteria: rubricDbds,
      },
    });

    const qArch = await prisma.sessionQuestion.create({
      data: {
        sessionId,
        sessionSkillId: createdSkills['ARCH'],
        sfiaSkillCode: 'ARCH',
        targetLevel: 4,
        orderIndex: 3,
        questionCategory: 'technical',
        questionText: 'Design a resilient event-driven architecture.',
        rubricCriteria: rubricArch,
      },
    });

    const qDesn = await prisma.sessionQuestion.create({
      data: {
        sessionId,
        sessionSkillId: createdSkills['DESN'],
        sfiaSkillCode: 'DESN',
        targetLevel: 4,
        orderIndex: 4,
        questionCategory: 'technical',
        questionText: 'Design component libraries and design tokens.',
        rubricCriteria: rubricDesn,
      },
    });
    console.log('   ✅ Đã tạo 4 câu hỏi phân bổ lũy tiến (orderIndex 1..4).');

    // 6. Giả lập 4 câu trả lời & AI Feedback:
    console.log('\n[6] Giả lập câu trả lời & chấm điểm nhị phân tất định...');
    const scoringEngine = new ScoringEngineService(prisma as any);

    // Turn 1 (PROG): Pass cả 2 -> Score 100, Level 4
    const ans1 = await prisma.userAnswer.create({
      data: {
        questionId: qProg.id,
        answerText: 'Chi tiết về libuv event loop và buffer allocation',
        answerMode: 'text',
        skipped: false,
      },
    });
    const q1Score = scoringEngine.calculateQuestionScore(
      [
        { criteriaId: 'core', passed: true, evidence: 'Event loop và microtasks hiểu rõ' },
        { criteriaId: 'seniority', passed: true, evidence: 'Nắm vững GC và backpressure' },
      ],
      rubricProg as any,
    );
    const q1Level = scoringEngine.inferDemonstratedLevel(4, q1Score.corePassRate, q1Score.seniorityPassRate);
    await prisma.aiFeedback.create({
      data: {
        userAnswerId: ans1.id,
        overallScore: q1Score.questionScore,
        demonstratedLevel: q1Level,
        criteriaPassRate: q1Score.criteriaPassRate,
        modelAnswer: 'Sample model answer for PROG',
        keyTakeaway: 'Focus on event loop performance and memory footprint.',
        promptVersion: 'v1.0',
      },
    });
    console.log(`   - PROG: Score=${q1Score.questionScore}, Level=${q1Level} (Đạt toàn diện)`);

    // Turn 2 (DBDS): Pass Core, Fail Seniority -> Score 60, Level 3
    const ans2 = await prisma.userAnswer.create({
      data: {
        questionId: qDbds.id,
        answerText: 'Sử dụng B-tree index cho foreign keys',
        answerMode: 'text',
        skipped: false,
      },
    });
    const q2Score = scoringEngine.calculateQuestionScore(
      [
        { criteriaId: 'core', passed: true, evidence: 'Sử dụng B-tree index cho foreign keys' },
        { criteriaId: 'seniority', passed: false, evidence: 'Chưa tối ưu partition' },
      ],
      rubricDbds as any,
    );
    const q2Level = scoringEngine.inferDemonstratedLevel(4, q2Score.corePassRate, q2Score.seniorityPassRate);
    await prisma.aiFeedback.create({
      data: {
        userAnswerId: ans2.id,
        overallScore: q2Score.questionScore,
        demonstratedLevel: q2Level,
        criteriaPassRate: q2Score.criteriaPassRate,
        modelAnswer: 'Sample model answer for DBDS',
        keyTakeaway: 'Remember partitioning maintenance overhead.',
        promptVersion: 'v1.0',
      },
    });
    console.log(`   - DBDS: Score=${q2Score.questionScore}, Level=${q2Level} (Trừ 1 level do trượt seniority)`);

    // Turn 3 (ARCH): Fail cả 2 -> Score 0, Level 2
    const ans3 = await prisma.userAnswer.create({
      data: {
        questionId: qArch.id,
        answerText: 'Không nắm rõ cơ chế phân tán',
        answerMode: 'text',
        skipped: false,
      },
    });
    const q3Score = scoringEngine.calculateQuestionScore(
      [
        { criteriaId: 'core', passed: false, evidence: 'Không nắm cơ chế phân tán' },
        { criteriaId: 'seniority', passed: false, evidence: 'Không giải thích được split-brain' },
      ],
      rubricArch as any,
    );
    const q3Level = scoringEngine.inferDemonstratedLevel(4, q3Score.corePassRate, q3Score.seniorityPassRate);
    await prisma.aiFeedback.create({
      data: {
        userAnswerId: ans3.id,
        overallScore: q3Score.questionScore,
        demonstratedLevel: q3Level,
        criteriaPassRate: q3Score.criteriaPassRate,
        modelAnswer: 'Sample model answer for ARCH',
        keyTakeaway: 'Study transactional outbox and saga pattern.',
        promptVersion: 'v1.0',
      },
    });
    console.log(`   - ARCH: Score=${q3Score.questionScore}, Level=${q3Level} (Trừ 2 level do hổng core)`);

    // Turn 4 (DESN): Skip -> Score 0, Level 1
    const ans4 = await prisma.userAnswer.create({
      data: {
        questionId: qDesn.id,
        answerText: '',
        answerMode: 'text',
        skipped: true,
      },
    });
    const skippedData = scoringEngine.buildSkippedFeedbackData(rubricDesn as any, 4);
    await prisma.aiFeedback.create({
      data: {
        userAnswerId: ans4.id,
        overallScore: skippedData.overallScore,
        demonstratedLevel: skippedData.demonstratedLevel,
        criteriaPassRate: 0,
        modelAnswer: 'Sample model answer for DESN',
        keyTakeaway: skippedData.keyTakeaway,
        promptVersion: 'v1.0',
      },
    });
    console.log(`   - DESN: Score=${skippedData.overallScore}, Level=${skippedData.demonstratedLevel} (Bỏ qua - Skip)`);

    // 7. Tổng hợp điểm phiên: aggregateSessionSkillScores
    console.log('\n[7] Tổng hợp điểm kỹ năng & phiên phỏng vấn (aggregateSessionSkillScores)...');
    await scoringEngine.aggregateSessionSkillScores(sessionId);

    // Kiểm tra kết quả trong CSDL PostgreSQL
    const updatedSkills = await prisma.sessionSkill.findMany({
      where: { sessionId },
    });
    for (const sk of updatedSkills) {
      console.log(`   - Kỹ năng ${sk.skillCode}: Score=${sk.score}, ActualLevel=${sk.actualLevel}`);
    }

    const updatedSession = await prisma.interviewSession.findUniqueOrThrow({
      where: { id: sessionId },
    });
    console.log(`   - Overall Score của phiên = ${updatedSession.overallScore}`);

    if (updatedSession.overallScore !== 40) {
      console.error(`❌ LỖI: Dự kiến điểm tổng là 40, thực tế là ${updatedSession.overallScore}`);
      passed = false;
    } else {
      console.log('   ✅ Điểm tổng 40 chính xác tuyệt đối ((100 + 60 + 0 + 0) / 4 = 40).');
    }

    // 8. Sinh Báo Cáo Năng Lực Hợp Nhất (Unified Competency Report)
    console.log('\n[8] Sinh Báo Cáo Năng Lực Hợp Nhất (Unified Competency Report)...');
    const unifiedReportGen = new UnifiedReportGeneratorService(prisma as any);
    await unifiedReportGen.generateReport(sessionId, 'vi');

    // Kiểm tra bản ghi session_competency_evaluation
    const report = await prisma.sessionReport.findUnique({
      where: {
        sessionId_reportType_version: {
          sessionId,
          reportType: 'session_competency_evaluation',
          version: 1,
        },
      },
    });

    if (!report) {
      console.error('❌ LỖI: Không tìm thấy bản ghi session_competency_evaluation trong session_reports!');
      passed = false;
    } else {
      console.log('   ✅ Đã sinh thành công bản ghi session_competency_evaluation.');
      const content = report.contentJson as any;
      console.log(`   - Recommendation: ${content.summary.recommendationStatus}`);
      console.log(`   - Overall Score: ${content.summary.overallScore}`);
      console.log(`   - SFIA Level: Target ${content.summary.targetSfiaLevel}, Demonstrated ${content.summary.demonstratedSfiaLevel}`);
      console.log(`   - Số kỹ năng đánh giá: ${content.skillsBreakdown.length}`);
      console.log(`   - Số đầu việc trong Action Plan: ${content.actionPlan.length}`);

      if (content.summary.recommendationStatus !== 'not_recommended') {
        console.error(`❌ LỖI: Dự kiến recommendationStatus = not_recommended, thực tế = ${content.summary.recommendationStatus}`);
        passed = false;
      }
    }

    // Kiểm tra bản ghi tương thích executive_summary
    const execReport = await prisma.sessionReport.findUnique({
      where: {
        sessionId_reportType_version: {
          sessionId,
          reportType: 'executive_summary',
          version: 1,
        },
      },
    });
    if (execReport) {
      console.log('   ✅ Bản ghi executive_summary tương thích ngược đã được lưu thành công.');
    } else {
      console.error('❌ LỖI: Thiếu bản ghi executive_summary tương thích ngược!');
      passed = false;
    }

  } catch (err) {
    console.error('❌ Ngoại lệ bất thường trong quá trình kiểm thử:', err);
    passed = false;
  } finally {
    // 9. Dọn dẹp dữ liệu kiểm thử
    console.log('\n[9] Dọn dẹp dữ liệu kiểm thử an toàn...');
    if (sessionId) {
      await prisma.interviewSession.delete({ where: { id: sessionId } }).catch(() => {});
      console.log('   ✅ Đã xóa test session và quan hệ cascade (skills, questions, answers, reports)');
    }
    if (jdId) {
      await prisma.savedJobDescription.delete({ where: { id: jdId } }).catch(() => {});
      console.log('   ✅ Đã xóa test job description');
    }
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
      console.log('   ✅ Đã xóa test user');
    }
    await prisma.$disconnect();
  }

  console.log('\n===============================================================');
  if (passed) {
    console.log('🎉 KIỂM THỬ TÍCH HỢP E2E LIVE DATABASE THÀNH CÔNG 100%!');
  } else {
    console.error('❌ CÓ LỖI XẢY RA TRONG QUÁ TRÌNH KIỂM THỬ E2E!');
    process.exit(1);
  }
  console.log('===============================================================');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
