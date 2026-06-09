import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { CONTEXT_PACK_DATA } from '../src/prisma/context-pack.data';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEMO_EMAIL = 'demo@interviewai.dev';
const DEMO_PASSWORD = 'Demo@123456';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seedContextPacks() {
  await prisma.$transaction(async (tx) => {
    for (const pack of CONTEXT_PACK_DATA) {
      await tx.contextPack.upsert({
        where: { id: pack.id },
        create: {
          id: pack.id,
          name: pack.name,
          rubricJson: pack.rubricJson,
          scoringWeights: pack.scoringWeights,
        },
        update: {
          name: pack.name,
          rubricJson: pack.rubricJson,
          scoringWeights: pack.scoringWeights,
        },
      });
    }

    for (const pack of CONTEXT_PACK_DATA) {
      for (const legacyId of pack.legacyIds) {
        await tx.interviewSession.updateMany({
          where: { contextPackId: legacyId },
          data: { contextPackId: pack.id },
        });
        await tx.questionBank.updateMany({
          where: { contextPackId: legacyId },
          data: { contextPackId: pack.id },
        });
        await tx.contextPack.deleteMany({ where: { id: legacyId } });
      }
    }
  });

  console.log('context_packs: canonical IDs ensured');
}

async function getOrCreateDemoUser(): Promise<string> {
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
  const existing = listData?.users?.find((u) => u.email === DEMO_EMAIL);
  if (existing) {
    console.log(`demo user: already exists (${existing.id})`);
    return existing.id;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`Failed to create demo user: ${error?.message}`);
  }
  console.log(`demo user: created (${data.user.id})`);

  // Wait for auth trigger to sync user into public.users
  await new Promise((r) => setTimeout(r, 1500));
  return data.user.id;
}

async function seedUserProfile(userId: string) {
  const existing = await prisma.userProfile.findUnique({ where: { userId } });
  if (existing) {
    console.log('user profile: already exists, skipping');
    return;
  }
  await prisma.userProfile.create({
    data: {
      userId,
      fullName: 'Nguyễn Văn Demo',
      targetPosition: 'Junior Backend Developer',
      targetRoleCategory: 'backend',
      targetLevel: 'junior',
      preferredTechStack: 'Node.js, NestJS, PostgreSQL',
      yearsExperience: 0,
      defaultLanguage: 'vi',
      ttsEnabled: false,
    },
  });
  console.log('user profile: created');
}

async function seedSessions(userId: string) {
  const existingSessions = await prisma.interviewSession.findMany({
    where: { userId },
  });
  if (existingSessions.length >= 2) {
    console.log('sessions: already seeded, skipping');
    return;
  }

  // Session 1 — Completed, VN pack, Backend
  const session1 = await prisma.interviewSession.create({
    data: {
      userId,
      jobDescription: `Chúng tôi tìm kiếm Backend Developer với kinh nghiệm Node.js/NestJS.
Yêu cầu: Hiểu biết REST API, cơ sở dữ liệu PostgreSQL, Git workflow.
Mô tả công việc: Xây dựng và maintain các microservices, viết unit/integration tests,
tham gia code review và cải thiện hiệu năng hệ thống.`,
      jdSource: 'paste',
      jobTitle: 'Junior Backend Developer',
      sessionType: 'mixed',
      numQuestions: 3,
      difficulty: 'medium',
      persona: 'neutral_tech_lead',
      mode: 'practice',
      durationMin: 30,
      language: 'vi',
      contextPackId: 'VN',
      status: 'completed',
      overallScore: 72,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      executiveSummaryJson: {
        strengths: ['Nền tảng kỹ thuật tốt', 'Trả lời có cấu trúc rõ ràng'],
        improvements: [
          'Cần bổ sung ví dụ cụ thể hơn',
          'Mở rộng kiến thức về system design',
        ],
        overallAssessment:
          'Ứng viên có tiềm năng tốt, cần thêm kinh nghiệm thực tế.',
      },
    },
  });

  const q1 = await prisma.sessionQuestion.create({
    data: {
      sessionId: session1.id,
      questionText:
        'Hãy giải thích sự khác biệt giữa REST API và GraphQL, và khi nào nên dùng cái nào?',
      orderIndex: 0,
      questionCategory: 'technical',
      competencyDomain: 'TD1',
      rubricJson: {
        criteria: [
          {
            key: 'accuracy',
            weight: 0.4,
            description: 'Giải thích đúng kỹ thuật',
          },
          {
            key: 'comparison',
            weight: 0.3,
            description: 'So sánh trade-offs rõ ràng',
          },
          {
            key: 'use_case',
            weight: 0.3,
            description: 'Biết khi nào dùng cái nào',
          },
        ],
      },
      estimatedTimeMin: 5,
    },
  });

  const a1 = await prisma.userAnswer.create({
    data: {
      sessionId: session1.id,
      questionId: q1.id,
      answerMode: 'text',
      answerText:
        'REST API dùng HTTP methods (GET, POST, PUT, DELETE) với các endpoint cố định, còn GraphQL cho phép client query chính xác dữ liệu cần. REST phù hợp khi cần cache tốt và team quen thuộc, GraphQL phù hợp khi frontend cần linh hoạt query nhiều loại data khác nhau mà không muốn over-fetch.',
      skipped: false,
      feedbackGenerated: true,
    },
  });

  await prisma.aiFeedback.create({
    data: {
      userAnswerId: a1.id,
      overallScore: 75,
      modelAnswer:
        'REST API là kiến trúc dùng HTTP verbs và URL endpoints cố định. Mỗi endpoint trả về cấu trúc data định sẵn — đơn giản, dễ cache, phổ biến. GraphQL là query language, client định nghĩa chính xác data cần, tránh over/under-fetching. Chọn REST khi API đơn giản, cần caching mạnh, hoặc team chưa quen GraphQL. Chọn GraphQL khi nhiều client khác nhau cần data shapes khác nhau, hoặc khi muốn giảm số round-trips.',
      keyTakeaway:
        'Câu trả lời đúng hướng nhưng thiếu ví dụ thực tế và trade-offs về caching trong GraphQL.',
      promptVersion: 'v1.0-seed',
      isFallback: false,
      annotatedSegments: {
        create: [
          {
            segmentText:
              'REST API dùng HTTP methods (GET, POST, PUT, DELETE) với các endpoint cố định',
            startIndex: 0,
            endIndex: 65,
            highlightLevel: 'good',
            annotation: 'Định nghĩa chính xác, súc tích.',
            suggestion: null,
            improvedVersion: null,
          },
          {
            segmentText: 'REST phù hợp khi cần cache tốt và team quen thuộc',
            startIndex: 155,
            endIndex: 204,
            highlightLevel: 'warning',
            annotation:
              'Thiếu giải thích tại sao REST cache tốt hơn (HTTP GET cacheable natively).',
            suggestion: 'Đề cập HTTP caching headers và CDN support.',
            improvedVersion:
              'REST phù hợp khi cần tận dụng HTTP caching (GET responses có thể cache ở CDN/browser) và khi API tương đối ổn định.',
          },
        ],
      },
    },
  });

  const q2 = await prisma.sessionQuestion.create({
    data: {
      sessionId: session1.id,
      questionText: 'Bạn xử lý N+1 query problem trong ORM như thế nào?',
      orderIndex: 1,
      questionCategory: 'technical',
      competencyDomain: 'TD4',
      rubricJson: {
        criteria: [
          {
            key: 'problem_understanding',
            weight: 0.3,
            description: 'Hiểu N+1 là gì',
          },
          {
            key: 'solution',
            weight: 0.5,
            description: 'Giải pháp đúng kỹ thuật',
          },
          { key: 'tools', weight: 0.2, description: 'Biết dùng tool detect' },
        ],
      },
      estimatedTimeMin: 5,
    },
  });

  const a2 = await prisma.userAnswer.create({
    data: {
      sessionId: session1.id,
      questionId: q2.id,
      answerMode: 'text',
      answerText:
        'N+1 là khi load 1 list N items, sau đó query thêm 1 lần nữa cho mỗi item. Trong Prisma thì dùng include để eager load, ví dụ prisma.user.findMany({ include: { posts: true } }) thay vì loop qua từng user để lấy posts.',
      skipped: false,
      feedbackGenerated: true,
    },
  });

  await prisma.aiFeedback.create({
    data: {
      userAnswerId: a2.id,
      overallScore: 78,
      modelAnswer:
        'N+1 problem xảy ra khi fetch list N records, rồi query thêm 1 lần cho mỗi record (total: N+1 queries). Fix: eager loading (Prisma `include`, Sequelize `include`, TypeORM `relations`), hoặc DataLoader pattern để batch queries. Detect bằng query logging hoặc tools như Prisma query events.',
      keyTakeaway:
        'Hiểu vấn đề tốt, có ví dụ Prisma cụ thể. Nên thêm cách detect và DataLoader pattern.',
      promptVersion: 'v1.0-seed',
      isFallback: false,
      annotatedSegments: {
        create: [
          {
            segmentText:
              'N+1 là khi load 1 list N items, sau đó query thêm 1 lần nữa cho mỗi item',
            startIndex: 0,
            endIndex: 70,
            highlightLevel: 'good',
            annotation: 'Định nghĩa đúng và rõ ràng.',
            suggestion: null,
            improvedVersion: null,
          },
          {
            segmentText: 'prisma.user.findMany({ include: { posts: true } })',
            startIndex: 120,
            endIndex: 170,
            highlightLevel: 'good',
            annotation: 'Ví dụ code cụ thể — rất tốt trong phỏng vấn kỹ thuật.',
            suggestion: null,
            improvedVersion: null,
          },
        ],
      },
    },
  });

  const q3 = await prisma.sessionQuestion.create({
    data: {
      sessionId: session1.id,
      questionText:
        'Kể về một lần bạn gặp conflict với teammate và cách bạn giải quyết?',
      orderIndex: 2,
      questionCategory: 'behavioral',
      competencyDomain: 'D3',
      rubricJson: {
        criteria: [
          {
            key: 'star_structure',
            weight: 0.3,
            description: 'Dùng cấu trúc STAR',
          },
          {
            key: 'self_awareness',
            weight: 0.35,
            description: 'Tự nhận thức, không đổ lỗi',
          },
          { key: 'outcome', weight: 0.35, description: 'Kết quả cụ thể' },
        ],
      },
      estimatedTimeMin: 5,
    },
  });

  const a3 = await prisma.userAnswer.create({
    data: {
      sessionId: session1.id,
      questionId: q3.id,
      answerMode: 'text',
      answerText:
        'Trong project cuối kỳ, tôi và teammate bất đồng về cách thiết kế database. Tôi muốn normalize nhiều hơn còn bạn muốn denormalize để query nhanh hơn. Tôi đề xuất ngồi lại phân tích use case cụ thể, sau đó cả hai đồng ý dùng hybrid approach. Project hoàn thành đúng hạn và performance đạt yêu cầu.',
      skipped: false,
      feedbackGenerated: true,
    },
  });

  await prisma.aiFeedback.create({
    data: {
      userAnswerId: a3.id,
      overallScore: 68,
      modelAnswer:
        'Câu trả lời behavioral tốt cần dùng cấu trúc STAR (Situation, Task, Action, Result). Nêu rõ bối cảnh, vai trò của bạn, hành động cụ thể bạn thực hiện (không phải "cả hai"), và kết quả đo được.',
      keyTakeaway:
        'Có cấu trúc nhưng Action quá ngắn — cần nêu rõ bạn làm gì cụ thể, không chỉ "đề xuất ngồi lại".',
      promptVersion: 'v1.0-seed',
      isFallback: false,
      annotatedSegments: {
        create: [
          {
            segmentText: 'Tôi đề xuất ngồi lại phân tích use case cụ thể',
            startIndex: 130,
            endIndex: 176,
            highlightLevel: 'warning',
            annotation:
              'Action quá mờ nhạt. Phỏng vấn viên muốn biết bạn đã làm GÌ cụ thể.',
            suggestion:
              'Mô tả chi tiết hơn: bạn chuẩn bị tài liệu gì, đặt câu hỏi gì, ai quyết định cuối.',
            improvedVersion:
              'Tôi chuẩn bị một bảng so sánh pros/cons của từng approach với 3 query pattern thực tế nhất, sau đó present cho team.',
          },
          {
            segmentText:
              'Project hoàn thành đúng hạn và performance đạt yêu cầu',
            startIndex: 220,
            endIndex: 272,
            highlightLevel: 'good',
            annotation: 'Kết quả rõ ràng — tốt.',
            suggestion: null,
            improvedVersion: null,
          },
        ],
      },
    },
  });

  console.log(
    'session 1 (completed): created with 3 questions + answers + feedback',
  );

  // Session 2 — Completed, VN pack, Frontend JD
  const session2 = await prisma.interviewSession.create({
    data: {
      userId,
      jobDescription: `Frontend Developer tại startup fintech. Yêu cầu: React, TypeScript, hiểu RESTful API.
Bạn sẽ làm việc trực tiếp với product team để build tính năng mới và cải thiện UX.
Cần có khả năng tự học nhanh và làm việc trong môi trường thay đổi nhanh.`,
      jdSource: 'paste',
      jobTitle: 'Junior Frontend Developer',
      sessionType: 'hr',
      numQuestions: 2,
      difficulty: 'easy',
      persona: 'friendly_hr',
      mode: 'practice',
      durationMin: 20,
      language: 'vi',
      contextPackId: 'VN',
      status: 'completed',
      overallScore: 65,
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      executiveSummaryJson: {
        strengths: ['Tự tin trình bày', 'Hiểu rõ mục tiêu bản thân'],
        improvements: ['Câu trả lời hơi chung chung, cần ví dụ cụ thể hơn'],
        overallAssessment:
          'Potential tốt cho vị trí junior, cần polish câu trả lời behavioral.',
      },
    },
  });

  const q4 = await prisma.sessionQuestion.create({
    data: {
      sessionId: session2.id,
      questionText: 'Tại sao bạn muốn làm việc tại công ty chúng tôi?',
      orderIndex: 0,
      questionCategory: 'behavioral',
      competencyDomain: 'D4',
      rubricJson: {
        criteria: [
          {
            key: 'research',
            weight: 0.35,
            description: 'Đã tìm hiểu về công ty',
          },
          {
            key: 'alignment',
            weight: 0.4,
            description: 'Kết nối với mục tiêu bản thân',
          },
          {
            key: 'genuine',
            weight: 0.25,
            description: 'Câu trả lời chân thật',
          },
        ],
      },
      estimatedTimeMin: 4,
    },
  });

  const a4 = await prisma.userAnswer.create({
    data: {
      sessionId: session2.id,
      questionId: q4.id,
      answerMode: 'text',
      answerText:
        'Tôi muốn làm việc ở đây vì đây là môi trường fintech đang tăng trưởng mạnh, tôi muốn học hỏi thêm về domain này và đóng góp bằng kỹ năng React của mình. Ngoài ra tôi thích môi trường startup nhỏ nơi mình có thể thấy impact của công việc trực tiếp.',
      skipped: false,
      feedbackGenerated: true,
    },
  });

  await prisma.aiFeedback.create({
    data: {
      userAnswerId: a4.id,
      overallScore: 62,
      modelAnswer:
        'Câu trả lời tốt cần: (1) thể hiện đã research về công ty cụ thể, (2) kết nối điểm mạnh của bạn với nhu cầu của họ, (3) chân thật về lý do cá nhân.',
      keyTakeaway:
        'Câu trả lời còn generic — "fintech đang tăng trưởng" áp dụng được cho bất kỳ fintech nào. Cần mention điều gì cụ thể về công ty này.',
      promptVersion: 'v1.0-seed',
      isFallback: false,
      annotatedSegments: {
        create: [
          {
            segmentText: 'đây là môi trường fintech đang tăng trưởng mạnh',
            startIndex: 22,
            endIndex: 68,
            highlightLevel: 'warning',
            annotation:
              'Quá generic — không cho thấy bạn đã research về công ty này cụ thể.',
            suggestion:
              'Mention sản phẩm cụ thể, tính năng, hoặc tin tức gần đây của họ.',
            improvedVersion:
              'Tôi ấn tượng với cách [tên công ty] giải quyết [vấn đề cụ thể] — tôi đã dùng thử app và thấy UX rất clean.',
          },
          {
            segmentText:
              'tôi thích môi trường startup nhỏ nơi mình có thể thấy impact của công việc trực tiếp',
            startIndex: 160,
            endIndex: 248,
            highlightLevel: 'good',
            annotation: 'Câu này chân thật và có giá trị.',
            suggestion: null,
            improvedVersion: null,
          },
        ],
      },
    },
  });

  const q5 = await prisma.sessionQuestion.create({
    data: {
      sessionId: session2.id,
      questionText:
        'Điểm yếu lớn nhất của bạn là gì và bạn đang cải thiện nó như thế nào?',
      orderIndex: 1,
      questionCategory: 'behavioral',
      competencyDomain: 'D6',
      rubricJson: {
        criteria: [
          {
            key: 'honesty',
            weight: 0.3,
            description: 'Thật thà, không nói điểm yếu giả',
          },
          {
            key: 'growth',
            weight: 0.4,
            description: 'Có kế hoạch cải thiện cụ thể',
          },
          { key: 'awareness', weight: 0.3, description: 'Tự nhận thức tốt' },
        ],
      },
      estimatedTimeMin: 4,
    },
  });

  const a5 = await prisma.userAnswer.create({
    data: {
      sessionId: session2.id,
      questionId: q5.id,
      answerMode: 'text',
      answerText:
        'Điểm yếu của tôi là đôi khi tôi perfectionist quá mức, dành nhiều thời gian cho chi tiết nhỏ. Tôi đang cải thiện bằng cách đặt time-box cho từng task và ưu tiên theo impact.',
      skipped: false,
      feedbackGenerated: true,
    },
  });

  await prisma.aiFeedback.create({
    data: {
      userAnswerId: a5.id,
      overallScore: 70,
      modelAnswer:
        'Câu trả lời về điểm yếu tốt cần: điểm yếu thật (không phải "tôi làm việc quá chăm"), giải thích impact thực tế, và kế hoạch cải thiện có kết quả đo được.',
      keyTakeaway:
        'Điểm yếu thật, kế hoạch hợp lý. Cần thêm kết quả cụ thể từ việc cải thiện.',
      promptVersion: 'v1.0-seed',
      isFallback: false,
      annotatedSegments: {
        create: [
          {
            segmentText: 'đặt time-box cho từng task và ưu tiên theo impact',
            startIndex: 122,
            endIndex: 171,
            highlightLevel: 'good',
            annotation: 'Giải pháp cụ thể và thực tế.',
            suggestion: null,
            improvedVersion: null,
          },
          {
            segmentText: 'đôi khi tôi perfectionist quá mức',
            startIndex: 18,
            endIndex: 51,
            highlightLevel: 'warning',
            annotation:
              '"Perfectionist" là điểm yếu phổ biến nhất trong phỏng vấn — nghe không tự nhiên.',
            suggestion:
              'Thêm ví dụ cụ thể khi perfectionism đã gây ra vấn đề thực tế.',
            improvedVersion:
              'Trong project nhóm cuối kỳ, tôi mất 2 ngày refactor CSS mà lẽ ra chỉ cần 4 tiếng — điều này làm chậm tiến độ của cả team.',
          },
        ],
      },
    },
  });

  console.log(
    'session 2 (completed): created with 2 questions + answers + feedback',
  );
}

async function seedQuestionBank() {
  const count = await prisma.questionBank.count();
  if (count >= 90) {
    console.log('question_bank: already seeded, skipping');
    return;
  }

  const questions = [
    // ── Pair A: hr × VN ──────────────────────────────────────────────────────
    {
      content: 'Hãy giới thiệu về bản thân bạn trong 2 phút.',
      sessionType: 'hr',
      difficulty: 1,
      contextPackId: 'VN',
      subcategory: 'self-introduction',
      competencyDomain: 'D4',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content: 'Tại sao bạn lựa chọn nghề IT/lập trình?',
      sessionType: 'hr',
      difficulty: 1,
      contextPackId: 'VN',
      subcategory: 'motivation',
      competencyDomain: 'D4',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content: 'Bạn biết gì về công ty và vị trí bạn đang ứng tuyển?',
      sessionType: 'hr',
      difficulty: 2,
      contextPackId: 'VN',
      subcategory: 'culture-fit',
      competencyDomain: 'D5',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content: 'Bạn thích làm việc độc lập hay theo nhóm? Tại sao?',
      sessionType: 'hr',
      difficulty: 2,
      contextPackId: 'VN',
      subcategory: 'teamwork-preference',
      competencyDomain: 'D3',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content: 'Môi trường làm việc lý tưởng của bạn trông như thế nào?',
      sessionType: 'hr',
      difficulty: 2,
      contextPackId: 'VN',
      subcategory: 'culture-fit',
      competencyDomain: 'D5',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'Mô tả cách bạn giải thích một khái niệm kỹ thuật phức tạp cho người không có nền tảng IT.',
      sessionType: 'hr',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'communication',
      competencyDomain: 'D1',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'Kể về một lần bạn thuyết phục thành công đồng nghiệp hoặc sếp chấp nhận ý kiến của bạn.',
      sessionType: 'hr',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'persuasion',
      competencyDomain: 'D1',
      applicableRoles: ['all'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'Kể về một lần bạn conflict với teammate. Bạn đã xử lý thế nào và kết quả ra sao?',
      sessionType: 'hr',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'conflict-resolution',
      competencyDomain: 'D3',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content: 'Điều gì thúc đẩy bạn làm việc hiệu quả nhất? Cho ví dụ cụ thể.',
      sessionType: 'hr',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'motivation',
      competencyDomain: 'D4',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'Điểm yếu lớn nhất của bạn là gì và bạn đang cải thiện nó như thế nào?',
      sessionType: 'hr',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'self-awareness',
      competencyDomain: 'D6',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'Kể về một kỹ năng bạn tự học trong 6 tháng gần nhất. Kết quả bạn đạt được là gì?',
      sessionType: 'hr',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'growth-mindset',
      competencyDomain: 'D2',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Kể về một vấn đề khó mà bạn đã giải quyết thành công. Quy trình tiếp cận của bạn là gì?',
      sessionType: 'hr',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'problem-solving',
      competencyDomain: 'D2',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'Nếu deadline project bị rút ngắn đột ngột còn một nửa nhưng scope không đổi, bạn sẽ làm gì?',
      sessionType: 'hr',
      difficulty: 4,
      contextPackId: 'VN',
      subcategory: 'prioritization',
      competencyDomain: 'D2',
      applicableRoles: ['all'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'Nếu sếp giao task theo hướng tiếp cận mà bạn cho là không tối ưu, bạn xử lý thế nào?',
      sessionType: 'hr',
      difficulty: 4,
      contextPackId: 'VN',
      subcategory: 'upward-communication',
      competencyDomain: 'D4',
      applicableRoles: ['all'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'Nhìn lại 1 năm qua, thành tích bạn tự hào nhất là gì và điều gì bạn muốn làm khác đi?',
      sessionType: 'hr',
      difficulty: 5,
      contextPackId: 'VN',
      subcategory: 'reflection',
      competencyDomain: 'D6',
      applicableRoles: ['all'],
      applicableLevels: ['mid', 'senior'],
    },
    // ── Pair B: hr × Western ─────────────────────────────────────────────────
    {
      content: 'Tell me about yourself.',
      sessionType: 'hr',
      difficulty: 1,
      contextPackId: 'Western',
      subcategory: 'self-introduction',
      competencyDomain: 'D4',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content: 'Why did you choose a career in software engineering?',
      sessionType: 'hr',
      difficulty: 1,
      contextPackId: 'Western',
      subcategory: 'motivation',
      competencyDomain: 'D4',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'What do you know about our company and why do you want to work here?',
      sessionType: 'hr',
      difficulty: 2,
      contextPackId: 'Western',
      subcategory: 'culture-fit',
      competencyDomain: 'D5',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'Do you prefer working independently or on a team? Give an example.',
      sessionType: 'hr',
      difficulty: 2,
      contextPackId: 'Western',
      subcategory: 'teamwork-preference',
      competencyDomain: 'D3',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content: 'Describe your ideal work environment.',
      sessionType: 'hr',
      difficulty: 2,
      contextPackId: 'Western',
      subcategory: 'culture-fit',
      competencyDomain: 'D5',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'Describe a time you had to explain a complex technical concept to a non-technical stakeholder.',
      sessionType: 'hr',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'communication',
      competencyDomain: 'D1',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'Tell me about a time you successfully persuaded a colleague or manager to adopt your approach.',
      sessionType: 'hr',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'persuasion',
      competencyDomain: 'D1',
      applicableRoles: ['all'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'Tell me about a time you had a conflict with a coworker. How did you handle it and what was the outcome?',
      sessionType: 'hr',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'conflict-resolution',
      competencyDomain: 'D3',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'What motivates you to do your best work? Give a concrete example.',
      sessionType: 'hr',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'motivation',
      competencyDomain: 'D4',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'What is your biggest weakness, and what are you actively doing to improve it?',
      sessionType: 'hr',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'self-awareness',
      competencyDomain: 'D6',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'Tell me about a skill you taught yourself in the past six months. What was the outcome?',
      sessionType: 'hr',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'growth-mindset',
      competencyDomain: 'D2',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Describe a difficult problem you solved successfully. Walk me through your approach.',
      sessionType: 'hr',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'problem-solving',
      competencyDomain: 'D2',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'If a project deadline was suddenly cut in half with no scope reduction, what would you do?',
      sessionType: 'hr',
      difficulty: 4,
      contextPackId: 'Western',
      subcategory: 'prioritization',
      competencyDomain: 'D2',
      applicableRoles: ['all'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'If your manager assigns a task using an approach you believe is suboptimal, how do you handle it?',
      sessionType: 'hr',
      difficulty: 4,
      contextPackId: 'Western',
      subcategory: 'upward-communication',
      competencyDomain: 'D4',
      applicableRoles: ['all'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'Looking back at the past year, what is your greatest accomplishment and what would you do differently?',
      sessionType: 'hr',
      difficulty: 5,
      contextPackId: 'Western',
      subcategory: 'reflection',
      competencyDomain: 'D6',
      applicableRoles: ['all'],
      applicableLevels: ['mid', 'senior'],
    },
    // ── Pair C: technical × VN ───────────────────────────────────────────────
    {
      content:
        'REST là gì và tại sao nó phổ biến? Nêu ít nhất 3 đặc điểm chính.',
      sessionType: 'technical',
      difficulty: 1,
      contextPackId: 'VN',
      subcategory: 'web-fundamentals',
      competencyDomain: 'TD1',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Sự khác biệt giữa SQL và NoSQL là gì? Khi nào bạn chọn cái nào?',
      sessionType: 'technical',
      difficulty: 2,
      contextPackId: 'VN',
      subcategory: 'databases',
      competencyDomain: 'TD1',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Git workflow bạn hay dùng trong dự án nhóm là gì? Giải thích các bước từ feature đến merge.',
      sessionType: 'technical',
      difficulty: 2,
      contextPackId: 'VN',
      subcategory: 'version-control',
      competencyDomain: 'TD2',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Khi nào bạn dùng async/await thay vì Promise chain? Cho ví dụ cụ thể.',
      sessionType: 'technical',
      difficulty: 2,
      contextPackId: 'VN',
      subcategory: 'async-programming',
      competencyDomain: 'TD1',
      applicableRoles: ['backend', 'frontend', 'fullstack'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Khi code của bạn không chạy như mong đợi, quy trình debug của bạn là gì?',
      sessionType: 'technical',
      difficulty: 2,
      contextPackId: 'VN',
      subcategory: 'debugging',
      competencyDomain: 'TD5',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'SOLID principles là gì? Giải thích Single Responsibility với ví dụ thực tế.',
      sessionType: 'technical',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'design-principles',
      competencyDomain: 'TD4',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'Bạn xử lý N+1 query problem trong ORM như thế nào? Cho ví dụ code cụ thể.',
      sessionType: 'technical',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'database-optimization',
      competencyDomain: 'TD2',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Mô tả cách bạn thiết kế REST API endpoint cho một feature CRUD đơn giản. Nêu rõ HTTP methods và response shapes.',
      sessionType: 'technical',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'api-design',
      competencyDomain: 'TD2',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Code review là gì và bạn chú ý điều gì nhất khi review code của người khác?',
      sessionType: 'technical',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'code-quality',
      competencyDomain: 'TD4',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'Unit test và integration test khác nhau như thế nào? Bạn viết test như thế nào trong project?',
      sessionType: 'technical',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'testing',
      competencyDomain: 'TD4',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Bạn dùng tool/technique gì để detect performance bottleneck trong application?',
      sessionType: 'technical',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'performance',
      competencyDomain: 'TD5',
      applicableRoles: ['backend', 'frontend', 'fullstack'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'Nếu hệ thống cần scale từ 1.000 lên 100.000 concurrent users, bạn sẽ thay đổi architecture như thế nào?',
      sessionType: 'technical',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'scalability',
      competencyDomain: 'TD3',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'Làm thế nào để đảm bảo security cho một REST API endpoint nhận user input? Liệt kê ít nhất 5 biện pháp.',
      sessionType: 'technical',
      difficulty: 4,
      contextPackId: 'VN',
      subcategory: 'security',
      competencyDomain: 'TD4',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'Kể về một production bug khó nhất bạn từng gặp. Bạn reproduce, diagnose và fix nó như thế nào?',
      sessionType: 'technical',
      difficulty: 4,
      contextPackId: 'VN',
      subcategory: 'debugging',
      competencyDomain: 'TD5',
      applicableRoles: ['all'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'Thiết kế sơ bộ một hệ thống URL shortener (như bit.ly). Nêu các thành phần chính, data model, và cách handle collision.',
      sessionType: 'technical',
      difficulty: 5,
      contextPackId: 'VN',
      subcategory: 'system-design',
      competencyDomain: 'TD3',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['mid', 'senior'],
    },
    // ── Pair D: technical × Western ──────────────────────────────────────────
    {
      content:
        'What is REST and why is it widely used? Name at least 3 key characteristics.',
      sessionType: 'technical',
      difficulty: 1,
      contextPackId: 'Western',
      subcategory: 'web-fundamentals',
      competencyDomain: 'TD1',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'What are the differences between SQL and NoSQL databases? When would you choose one over the other?',
      sessionType: 'technical',
      difficulty: 2,
      contextPackId: 'Western',
      subcategory: 'databases',
      competencyDomain: 'TD1',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Describe the Git workflow your team uses. Walk through the steps from creating a feature to merging it.',
      sessionType: 'technical',
      difficulty: 2,
      contextPackId: 'Western',
      subcategory: 'version-control',
      competencyDomain: 'TD2',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'When would you use async/await versus Promise chaining? Give a concrete example.',
      sessionType: 'technical',
      difficulty: 2,
      contextPackId: 'Western',
      subcategory: 'async-programming',
      competencyDomain: 'TD1',
      applicableRoles: ['backend', 'frontend', 'fullstack'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Walk me through your debugging process when code is not behaving as expected.',
      sessionType: 'technical',
      difficulty: 2,
      contextPackId: 'Western',
      subcategory: 'debugging',
      competencyDomain: 'TD5',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'What are the SOLID principles? Explain Single Responsibility with a real-world example.',
      sessionType: 'technical',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'design-principles',
      competencyDomain: 'TD4',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'How do you handle the N+1 query problem in an ORM? Show a code example.',
      sessionType: 'technical',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'database-optimization',
      competencyDomain: 'TD2',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Describe how you would design REST API endpoints for a simple CRUD feature. Specify HTTP methods and response shapes.',
      sessionType: 'technical',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'api-design',
      competencyDomain: 'TD2',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'What do you focus on during a code review? What makes code "reviewable"?',
      sessionType: 'technical',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'code-quality',
      competencyDomain: 'TD4',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'How do unit tests differ from integration tests? How do you approach testing in your projects?',
      sessionType: 'technical',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'testing',
      competencyDomain: 'TD4',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'What tools or techniques do you use to identify performance bottlenecks in an application?',
      sessionType: 'technical',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'performance',
      competencyDomain: 'TD5',
      applicableRoles: ['backend', 'frontend', 'fullstack'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'If your system needs to scale from 1,000 to 100,000 concurrent users, what architectural changes would you make?',
      sessionType: 'technical',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'scalability',
      competencyDomain: 'TD3',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'How would you secure a REST API endpoint that accepts user input? List at least 5 measures.',
      sessionType: 'technical',
      difficulty: 4,
      contextPackId: 'Western',
      subcategory: 'security',
      competencyDomain: 'TD4',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'Describe the hardest production bug you have ever encountered. How did you reproduce, diagnose, and fix it?',
      sessionType: 'technical',
      difficulty: 4,
      contextPackId: 'Western',
      subcategory: 'debugging',
      competencyDomain: 'TD5',
      applicableRoles: ['all'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'Design a simplified URL shortener system (like bit.ly). Describe the main components, data model, and how you handle hash collisions.',
      sessionType: 'technical',
      difficulty: 5,
      contextPackId: 'Western',
      subcategory: 'system-design',
      competencyDomain: 'TD3',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['mid', 'senior'],
    },
    // ── Pair E: mixed × VN ───────────────────────────────────────────────────
    {
      content:
        'Hãy giới thiệu bản thân và một project kỹ thuật bạn tự hào nhất.',
      sessionType: 'mixed',
      difficulty: 1,
      contextPackId: 'VN',
      subcategory: 'self-introduction',
      competencyDomain: 'D4',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Bạn biết gì về Git? Mô tả quy trình từ code đến push lên remote.',
      sessionType: 'mixed',
      difficulty: 2,
      contextPackId: 'VN',
      subcategory: 'version-control',
      competencyDomain: 'TD1',
      applicableRoles: ['all'],
      applicableLevels: ['junior'],
    },
    {
      content: 'Gặp vấn đề không biết giải quyết trong code, bạn làm gì?',
      sessionType: 'mixed',
      difficulty: 2,
      contextPackId: 'VN',
      subcategory: 'problem-solving',
      competencyDomain: 'D2',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content: 'Bạn nghĩ gì về việc làm thêm giờ khi project cần?',
      sessionType: 'mixed',
      difficulty: 2,
      contextPackId: 'VN',
      subcategory: 'culture-fit',
      competencyDomain: 'D5',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'Bạn tự đánh giá kỹ năng giao tiếp của mình thế nào? Cho ví dụ cụ thể.',
      sessionType: 'mixed',
      difficulty: 2,
      contextPackId: 'VN',
      subcategory: 'communication',
      competencyDomain: 'D1',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Điều gì khiến bạn muốn theo đuổi sự nghiệp trong ngành IT và vì sao lại chọn vai trò này?',
      sessionType: 'mixed',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'motivation',
      competencyDomain: 'D4',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'Bạn đã xây dựng project nào ấn tượng nhất? Mô tả các quyết định kỹ thuật quan trọng.',
      sessionType: 'mixed',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'technical-experience',
      competencyDomain: 'TD2',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Kể về một lần bạn phải học công nghệ mới trong thời gian ngắn. Cách tiếp cận và kết quả?',
      sessionType: 'mixed',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'learning-agility',
      competencyDomain: 'D2',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Bạn hiểu CI/CD là gì? Tại sao nó quan trọng và bạn đã dùng nó chưa?',
      sessionType: 'mixed',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'devops-awareness',
      competencyDomain: 'TD3',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Bạn làm gì để giữ code sạch và dễ bảo trì khi làm việc theo nhóm?',
      sessionType: 'mixed',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'code-quality',
      competencyDomain: 'TD4',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'Mô tả trải nghiệm làm việc nhóm kỹ thuật của bạn. Bạn thường đóng vai trò gì?',
      sessionType: 'mixed',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'teamwork',
      competencyDomain: 'D3',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'So với yêu cầu của vị trí này, bạn thấy mình đang thiếu kỹ năng gì? Kế hoạch bù đắp của bạn là gì?',
      sessionType: 'mixed',
      difficulty: 3,
      contextPackId: 'VN',
      subcategory: 'self-awareness',
      competencyDomain: 'D6',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Nếu phát hiện đồng nghiệp mắc lỗi nghiêm trọng gần deadline release, bạn xử lý thế nào?',
      sessionType: 'mixed',
      difficulty: 4,
      contextPackId: 'VN',
      subcategory: 'integrity',
      competencyDomain: 'D4',
      applicableRoles: ['all'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'Design một REST API đơn giản cho hệ thống quản lý task. Nêu endpoints chính, HTTP methods, và data model.',
      sessionType: 'mixed',
      difficulty: 4,
      contextPackId: 'VN',
      subcategory: 'api-design',
      competencyDomain: 'TD2',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'Kể về một project nhóm thất bại hoặc gặp khó khăn lớn. Bạn đóng góp gì, lỗi ở đâu, bài học bạn rút ra?',
      sessionType: 'mixed',
      difficulty: 5,
      contextPackId: 'VN',
      subcategory: 'reflection',
      competencyDomain: 'D3',
      applicableRoles: ['all'],
      applicableLevels: ['mid', 'senior'],
    },
    // ── Pair F: mixed × Western ──────────────────────────────────────────────
    {
      content:
        'Introduce yourself and walk me through your most impressive technical project.',
      sessionType: 'mixed',
      difficulty: 1,
      contextPackId: 'Western',
      subcategory: 'self-introduction',
      competencyDomain: 'D4',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Tell me about your experience with Git. Describe your workflow from coding to pushing to remote.',
      sessionType: 'mixed',
      difficulty: 2,
      contextPackId: 'Western',
      subcategory: 'version-control',
      competencyDomain: 'TD1',
      applicableRoles: ['all'],
      applicableLevels: ['junior'],
    },
    {
      content:
        'When you hit a blocker on a coding problem you cannot solve, what do you do?',
      sessionType: 'mixed',
      difficulty: 2,
      contextPackId: 'Western',
      subcategory: 'problem-solving',
      competencyDomain: 'D2',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'How do you feel about working overtime when a project demands it?',
      sessionType: 'mixed',
      difficulty: 2,
      contextPackId: 'Western',
      subcategory: 'culture-fit',
      competencyDomain: 'D5',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'How would you rate your communication skills and why? Give a specific example.',
      sessionType: 'mixed',
      difficulty: 2,
      contextPackId: 'Western',
      subcategory: 'communication',
      competencyDomain: 'D1',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'What drew you to a career in software engineering, and why this specific role?',
      sessionType: 'mixed',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'motivation',
      competencyDomain: 'D4',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        "What's the most impressive project you've built? Describe the key technical decisions you made.",
      sessionType: 'mixed',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'technical-experience',
      competencyDomain: 'TD2',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'Tell me about a time you had to learn a new technology quickly. How did you approach it and what was the result?',
      sessionType: 'mixed',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'learning-agility',
      competencyDomain: 'D2',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'What do you know about CI/CD? Why is it important and have you used it in your projects?',
      sessionType: 'mixed',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'devops-awareness',
      competencyDomain: 'TD3',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'What do you do to keep code clean and maintainable when working on a team?',
      sessionType: 'mixed',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'code-quality',
      competencyDomain: 'TD4',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'Describe your experience working in technical teams. What role do you typically play?',
      sessionType: 'mixed',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'teamwork',
      competencyDomain: 'D3',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid', 'senior'],
    },
    {
      content:
        'Compared to the requirements of this role, what skills do you think you are lacking? What is your plan to address the gaps?',
      sessionType: 'mixed',
      difficulty: 3,
      contextPackId: 'Western',
      subcategory: 'self-awareness',
      competencyDomain: 'D6',
      applicableRoles: ['all'],
      applicableLevels: ['junior', 'mid'],
    },
    {
      content:
        'If you discovered a teammate made a serious mistake close to a release deadline, how would you handle it?',
      sessionType: 'mixed',
      difficulty: 4,
      contextPackId: 'Western',
      subcategory: 'integrity',
      competencyDomain: 'D4',
      applicableRoles: ['all'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'Design a simple REST API for a task management system. Describe the main endpoints, HTTP methods, and data model.',
      sessionType: 'mixed',
      difficulty: 4,
      contextPackId: 'Western',
      subcategory: 'api-design',
      competencyDomain: 'TD2',
      applicableRoles: ['backend', 'fullstack'],
      applicableLevels: ['mid', 'senior'],
    },
    {
      content:
        'Tell me about a team project that failed or faced major challenges. What was your contribution, where did things go wrong, and what did you learn?',
      sessionType: 'mixed',
      difficulty: 5,
      contextPackId: 'Western',
      subcategory: 'reflection',
      competencyDomain: 'D3',
      applicableRoles: ['all'],
      applicableLevels: ['mid', 'senior'],
    },
  ];

  await prisma.questionBank.createMany({
    data: questions,
    skipDuplicates: true,
  });

  console.log(`question_bank: seeded ${questions.length} questions`);
}

async function main() {
  console.log('Starting seed...');

  await seedContextPacks();

  const userId = await getOrCreateDemoUser();

  // Ensure user record exists in public.users (trigger may take a moment)
  let publicUser: Awaited<ReturnType<typeof prisma.user.findUnique>> = null;
  for (let i = 0; i < 5; i++) {
    publicUser = await prisma.user.findUnique({ where: { id: userId } });
    if (publicUser) break;
    console.log(
      `Waiting for auth trigger to sync user (attempt ${i + 1}/5)...`,
    );
    await new Promise((r) => setTimeout(r, 1000));
  }

  if (!publicUser) {
    // Trigger didn't fire — insert manually
    console.log('Auth trigger did not fire — inserting user manually');
    await prisma.user.create({
      data: {
        id: userId,
        email: DEMO_EMAIL,
        role: 'candidate',
        status: 'active',
        profileCompleted: false,
      },
    });
  }

  await seedUserProfile(userId);
  await seedSessions(userId);
  await seedQuestionBank();

  console.log('\nSeed complete.');
  console.log(`Demo credentials: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
