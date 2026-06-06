import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

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
  const existing = await prisma.contextPack.findMany();
  if (existing.length >= 2) {
    console.log('context_packs: already seeded, skipping');
    return;
  }

  await prisma.contextPack.createMany({
    data: [
      {
        id: 'vn',
        name: 'Vietnam Context Pack',
        rubricJson: {
          behavioral: {
            D1: { name: 'Giao tiếp & Trình bày', weight: 0.2 },
            D2: { name: 'Tư duy & Giải quyết vấn đề', weight: 0.2 },
            D3: { name: 'Làm việc nhóm', weight: 0.15 },
            D4: { name: 'Thái độ & Động lực', weight: 0.2 },
            D5: { name: 'Phù hợp văn hóa', weight: 0.15 },
            D6: { name: 'Tự nhận thức', weight: 0.1 },
          },
          technical: {
            TD1: { name: 'Kiến thức nền tảng', weight: 0.25 },
            TD2: { name: 'Khả năng áp dụng thực tế', weight: 0.25 },
            TD3: { name: 'Tư duy hệ thống', weight: 0.2 },
            TD4: { name: 'Code quality & Best practices', weight: 0.2 },
            TD5: { name: 'Debug & Problem-solving', weight: 0.1 },
          },
        },
        scoringWeights: { behavioral_weight: 0.5, technical_weight: 0.5 },
      },
      {
        id: 'western',
        name: 'Western Context Pack',
        rubricJson: {
          behavioral: {
            D1: { name: 'Communication & Presentation', weight: 0.2 },
            D2: { name: 'Critical Thinking', weight: 0.2 },
            D3: { name: 'Collaboration & Teamwork', weight: 0.15 },
            D4: { name: 'Leadership & Initiative', weight: 0.2 },
            D5: { name: 'Culture Fit & Values', weight: 0.15 },
            D6: { name: 'Self-Awareness & Growth', weight: 0.1 },
          },
          technical: {
            TD1: { name: 'Foundational Knowledge', weight: 0.2 },
            TD2: { name: 'Practical Application', weight: 0.25 },
            TD3: { name: 'Systems Thinking', weight: 0.2 },
            TD4: { name: 'Code Quality & Best Practices', weight: 0.2 },
            TD5: { name: 'Debug & Problem-solving', weight: 0.15 },
          },
        },
        scoringWeights: { behavioral_weight: 0.45, technical_weight: 0.55 },
      },
    ],
    skipDuplicates: true,
  });
  console.log('context_packs: seeded');
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
      jdSource: 'manual',
      jobTitle: 'Junior Backend Developer',
      sessionType: 'mixed',
      numQuestions: 3,
      difficulty: 'medium',
      persona: 'neutral_tech_lead',
      mode: 'practice',
      durationMin: 30,
      language: 'vi',
      contextPackId: 'vn',
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
            highlightLevel: 'weak',
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
            highlightLevel: 'weak',
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
      jdSource: 'manual',
      jobTitle: 'Junior Frontend Developer',
      sessionType: 'behavioral',
      numQuestions: 2,
      difficulty: 'easy',
      persona: 'friendly_hr',
      mode: 'practice',
      durationMin: 20,
      language: 'vi',
      contextPackId: 'vn',
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
            highlightLevel: 'weak',
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
            highlightLevel: 'weak',
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

  console.log('\nSeed complete.');
  console.log(`Demo credentials: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
