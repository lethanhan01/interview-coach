import type { PrismaClient, QuestionBank } from '@prisma/client';
import { createAnswerWithFeedback, createFollowUp } from './_helpers';

// ─── Job descriptions (one per session) ─────────────────────────────────────

const JDS = {
  s1: '[SEED-S1] Vị trí: Junior Backend Developer (NestJS/PostgreSQL). Mô tả: Phát triển REST API, thiết kế DB schema, viết unit/integration tests, code review. Yêu cầu: Node.js, TypeScript, PostgreSQL, Git, 0-1 năm kinh nghiệm.',
  s2: '[SEED-S2] Vị trí: Junior Frontend Developer (React/Next.js). Mô tả: Xây dựng giao diện người dùng, tích hợp REST API, tối ưu hiệu năng. Yêu cầu: React 18+, TypeScript, Tailwind CSS, 0-1 năm kinh nghiệm.',
  s3: '[SEED-S3] Position: Junior Full-Stack Developer (React + Node.js). Description: Build and maintain web applications, integrate third-party APIs, write automated tests. Requirements: TypeScript, REST API, PostgreSQL, Git, 0-1 years experience.',
  s4: '[SEED-S4] Vị trí: Junior Software Engineer (tổng hợp). Mô tả: Làm việc trong team Agile, tham gia phát triển feature từ đầu đến cuối. Yêu cầu: Tốt nghiệp CNTT, kỹ năng giao tiếp tốt, chủ động học hỏi.',
  s5: '[SEED-S5] Vị trí: Backend Intern (Python/FastAPI). Mô tả: Hỗ trợ team backend xây dựng API và data pipeline. Yêu cầu: Python, SQL cơ bản, hiểu HTTP.',
  s6: '[SEED-S6] Vị trí: Junior Mobile Developer (React Native). Mô tả: Phát triển app cross-platform iOS/Android. Yêu cầu: JavaScript, React Native, REST API, 0-1 năm kinh nghiệm.',
  s7: '[SEED-S7] Position: Junior DevOps / Platform Engineer. Description: CI/CD pipelines, container orchestration, infrastructure-as-code. Requirements: Linux, Docker, basic scripting, strong communication.',
};

// ─── Rubric helper ───────────────────────────────────────────────────────────

function rubric(domain: string): object {
  const map: Record<string, { name: string; weight: number }> = {
    D1: { name: 'Giao tiếp & Trình bày', weight: 0.2 },
    D2: { name: 'Tư duy & Giải quyết vấn đề', weight: 0.2 },
    D3: { name: 'Làm việc nhóm', weight: 0.15 },
    D4: { name: 'Thái độ & Động lực', weight: 0.2 },
    D5: { name: 'Phù hợp văn hóa', weight: 0.15 },
    D6: { name: 'Tự nhận thức', weight: 0.1 },
    TD1: { name: 'Kiến thức nền tảng', weight: 0.25 },
    TD2: { name: 'Khả năng áp dụng thực tế', weight: 0.25 },
    TD3: { name: 'Tư duy hệ thống', weight: 0.2 },
    TD4: { name: 'Code quality & Best practices', weight: 0.2 },
    TD5: { name: 'Debug & Problem-solving', weight: 0.1 },
  };
  return { domain, ...map[domain] };
}

// ─── Question lookup ─────────────────────────────────────────────────────────

async function pickQuestions(
  prisma: PrismaClient,
  sessionType: string,
  contextPackId: string,
  take: number,
  skip = 0,
): Promise<QuestionBank[]> {
  return prisma.questionBank.findMany({
    where: { sessionType, contextPackId },
    orderBy: [{ difficulty: 'asc' }, { content: 'asc' }],
    take,
    skip,
  });
}

async function createSQ(
  prisma: PrismaClient,
  sessionId: string,
  q: QuestionBank,
  orderIndex: number,
): Promise<string> {
  const sq = await prisma.sessionQuestion.create({
    data: {
      sessionId,
      questionBankId: q.id,
      questionText: q.content,
      orderIndex,
      questionCategory: q.subcategory,
      competencyDomain: q.competencyDomain,
      rubricJson: rubric(q.competencyDomain),
      estimatedTimeMin: q.difficulty <= 2 ? 3 : q.difficulty <= 3 ? 5 : 8,
    },
  });
  return sq.id;
}

// ─── guard ───────────────────────────────────────────────────────────────────

async function alreadySeeded(
  prisma: PrismaClient,
  userId: string,
  marker: string,
): Promise<boolean> {
  const s = await prisma.interviewSession.findFirst({
    where: { userId, jobDescription: { contains: marker } },
    select: { id: true },
  });
  return s !== null;
}

// ═══════════════════════════════════════════════════════════════════════════
// S1 — completed · VN · mixed · score 72 · text answers · full feedback
// ═══════════════════════════════════════════════════════════════════════════
async function seedS1(prisma: PrismaClient, userId: string): Promise<void> {
  if (await alreadySeeded(prisma, userId, 'SEED-S1')) return;

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      jobDescription: JDS.s1,
      jdSource: 'paste',
      jobTitle: 'Junior Backend Developer',
      sessionType: 'mixed',
      numQuestions: 3,
      difficulty: 'medium',
      persona: 'neutral_tech_lead',
      language: 'vi',
      contextPackId: 'VN',
      status: 'completed',
      showPrepCard: true,
      openingTranscript: 'Xin chào! Tôi là AI Interviewer. Hôm nay chúng ta sẽ thực hiện buổi phỏng vấn thử cho vị trí Junior Backend Developer. Bạn có khoảng 30 phút. Hãy thoải mái và trả lời thật tự nhiên nhé.',
      overallScore: 72,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      selfEvalJson: {
        confidence: 3,
        clarity: 4,
        depth: 3,
        overall: 3,
        notes: 'Câu hỏi về REST API trả lời tốt, cần cải thiện phần ví dụ thực tế.',
      },
      executiveSummaryJson: {
        headline: 'Ứng viên có nền tảng kỹ thuật tốt, cần phát triển kỹ năng trình bày.',
        strengths: ['Kiến thức REST API vững', 'Thái độ học hỏi tích cực'],
        improvements: ['Cần đưa ví dụ cụ thể hơn', 'Cần cấu trúc câu trả lời rõ ràng hơn'],
        overallVerdict: 'Tiềm năng tốt, cần luyện tập thêm.',
      },
      commAnalysisJson: {
        clarityScore: 70,
        structureScore: 68,
        concisenessScore: 75,
        vocabularyRichness: 72,
        fillerWordCount: 12,
        avgSentenceLength: 18,
      },
      competencyHeatmapJson: {
        D1: 65,
        D2: 78,
        D3: 70,
        D4: 80,
        D5: 72,
        D6: 68,
        TD1: 75,
        TD2: 70,
        TD3: 65,
        TD4: 72,
        TD5: 68,
      },
      actionPlanJson: {
        immediate: [
          'Luyện tập cấu trúc câu trả lời theo STAR',
          'Chuẩn bị 3 ví dụ dự án cụ thể kèm số liệu',
        ],
        shortTerm: [
          'Xây dựng thêm 1 project cá nhân với NestJS',
          'Học thêm về system design cơ bản',
        ],
        resources: [
          'Sách "Clean Code" - Robert C. Martin',
          'Khóa học System Design Primer trên GitHub',
        ],
      },
    },
  });

  const qs = await pickQuestions(prisma, 'mixed', 'VN', 3, 0);
  const sqIds = await Promise.all(qs.map((q, i) => createSQ(prisma, session.id, q, i)));

  // Q1: text answer, good score, 2 segments
  const a1 = await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[0],
    answerText: 'Tôi là Nguyễn Văn Demo, vừa tốt nghiệp CNTT tại Bách Khoa Hà Nội. Trong quá trình học, tôi đã tự học NestJS và xây dựng một hệ thống quản lý task nhỏ. Tôi có kinh nghiệm với TypeScript, PostgreSQL và Git.',
    feedbackGenerated: true,
    feedback: {
      overallScore: 75,
      modelAnswer: 'Một câu giới thiệu tốt nên bao gồm: tên, background học vấn, dự án nổi bật kèm kết quả cụ thể, và mục tiêu ngắn hạn. Ví dụ: "Tôi đã xây dựng hệ thống X phục vụ Y người dùng, đạt Z % uptime."',
      keyTakeaway: 'Cần thêm kết quả đo lường được vào phần giới thiệu dự án.',
      promptVersion: 'feedback-v1.3',
      segments: [
        {
          segmentText: 'vừa tốt nghiệp CNTT tại Bách Khoa Hà Nội',
          startIndex: 8,
          endIndex: 48,
          highlightLevel: 'good',
          annotation: 'Nêu rõ xuất xứ học vấn — tốt.',
        },
        {
          segmentText: 'xây dựng một hệ thống quản lý task nhỏ',
          startIndex: 92,
          endIndex: 130,
          highlightLevel: 'warning',
          annotation: 'Dự án được đề cập nhưng thiếu số liệu cụ thể.',
          suggestion: 'Thêm: số người dùng, tính năng nổi bật, hoặc kết quả đạt được.',
          improvedVersion: 'xây dựng hệ thống quản lý task cho 20 người dùng, hỗ trợ real-time notification qua WebSocket',
        },
      ],
    },
  });

  // Q2: text answer, medium score, follow-up
  const a2 = await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[1],
    answerText: 'Tôi nghĩ việc học công nghệ mới quan trọng vì ngành IT thay đổi rất nhanh. Tôi hay đọc documentation và làm theo tutorial rồi build project nhỏ để thực hành.',
    feedbackGenerated: true,
    feedback: {
      overallScore: 68,
      modelAnswer: 'Câu trả lời tốt nên nêu: phương pháp học cụ thể (spaced repetition, building projects, reading docs), ví dụ công nghệ gần nhất bạn học, và kết quả bạn đạt được từ việc tự học đó.',
      keyTakeaway: 'Cần cụ thể hơn về tên công nghệ và thành quả đạt được khi tự học.',
      promptVersion: 'feedback-v1.3',
      segments: [
        {
          segmentText: 'đọc documentation và làm theo tutorial',
          startIndex: 90,
          endIndex: 128,
          highlightLevel: 'good',
          annotation: 'Phương pháp học đúng đắn.',
        },
        {
          segmentText: 'build project nhỏ để thực hành',
          startIndex: 133,
          endIndex: 163,
          highlightLevel: 'good',
          annotation: 'Học qua thực hành là cách tốt nhất.',
        },
      ],
    },
  });

  await createFollowUp(prisma, {
    userAnswerId: a2,
    followUpText: 'Bạn vừa đề cập đến việc tự học qua project nhỏ. Hãy kể về một project cụ thể bạn đã build để học một công nghệ mới — công nghệ đó là gì và bạn đã học được điều gì?',
    triggerRule: 'vague_answer',
    triggerReason: 'Ứng viên đề cập tự học nhưng không nêu ví dụ cụ thể nào.',
    followUpAnswerText: 'Tôi đã tự học NestJS bằng cách build một REST API cho hệ thống blog đơn giản. Tôi học được cách dùng dependency injection, Guards và interceptors trong NestJS.',
  });

  // Q3: text, higher score
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[2],
    answerText: 'REST là architectural style cho phép communication giữa client và server qua HTTP. Các đặc điểm chính gồm: stateless (mỗi request độc lập), uniform interface (dùng standard HTTP methods GET/POST/PUT/DELETE), client-server separation, và cacheable responses. REST phổ biến vì đơn giản, scalable và dễ test.',
    feedbackGenerated: true,
    feedback: {
      overallScore: 82,
      modelAnswer: 'REST (Representational State Transfer) là architectural style với 6 constraints: client-server, stateless, cacheable, uniform interface, layered system, code-on-demand (optional). Phổ biến vì: simplicity, scalability, language-agnostic, và HTTP ecosystem support.',
      keyTakeaway: 'Câu trả lời vững. Bổ sung thêm constraint "layered system" sẽ hoàn chỉnh hơn.',
      promptVersion: 'feedback-v1.3',
      segments: [
        {
          segmentText: 'stateless (mỗi request độc lập)',
          startIndex: 115,
          endIndex: 145,
          highlightLevel: 'good',
          annotation: 'Giải thích đúng và ngắn gọn.',
        },
        {
          segmentText: 'dùng standard HTTP methods GET/POST/PUT/DELETE',
          startIndex: 165,
          endIndex: 211,
          highlightLevel: 'good',
          annotation: 'Nêu đúng các HTTP methods tiêu chuẩn.',
        },
      ],
    },
  });

  console.log('sessions: S1 seeded (completed·VN·mixed·score=72)');
}

// ═══════════════════════════════════════════════════════════════════════════
// S2 — completed · VN · hr · score 65 · text answers
// ═══════════════════════════════════════════════════════════════════════════
async function seedS2(prisma: PrismaClient, userId: string): Promise<void> {
  if (await alreadySeeded(prisma, userId, 'SEED-S2')) return;

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      jobDescription: JDS.s2,
      jdSource: 'paste',
      jobTitle: 'Junior Frontend Developer',
      sessionType: 'hr',
      numQuestions: 2,
      difficulty: 'easy',
      persona: 'neutral_tech_lead',
      language: 'vi',
      contextPackId: 'VN',
      status: 'completed',
      showPrepCard: false,
      overallScore: 65,
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      selfEvalJson: {
        confidence: 2,
        clarity: 3,
        depth: 2,
        overall: 2,
        notes: 'Cảm thấy hơi căng thẳng, cần luyện tập thêm.',
      },
      executiveSummaryJson: {
        headline: 'Ứng viên có thái độ tốt nhưng cần cải thiện kỹ năng trình bày.',
        strengths: ['Thái độ cầu tiến', 'Trung thực về điểm yếu'],
        improvements: ['Cần dùng STAR framework', 'Ví dụ còn chung chung'],
        overallVerdict: 'Cần luyện tập thêm trước khi phỏng vấn thật.',
      },
      competencyHeatmapJson: {
        D1: 60,
        D2: 65,
        D3: 68,
        D4: 72,
        D5: 65,
        D6: 60,
      },
      actionPlanJson: {
        immediate: [
          'Học STAR framework và thực hành với 5 câu hỏi behavioral',
          'Ghi lại 3 câu chuyện từ dự án thực tế',
        ],
        shortTerm: ['Mock interview với bạn bè 2 lần/tuần'],
        resources: ['Guide STAR interview method trên Indeed.com'],
      },
    },
  });

  const qs = await pickQuestions(prisma, 'hr', 'VN', 2, 0);
  const sqIds = await Promise.all(qs.map((q, i) => createSQ(prisma, session.id, q, i)));

  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[0],
    answerText: 'Tôi là sinh viên vừa tốt nghiệp, hiện đang tìm công việc đầu tiên. Tôi thích làm việc với con người và muốn đóng góp cho team.',
    feedbackGenerated: true,
    feedback: {
      overallScore: 60,
      modelAnswer: 'Câu tự giới thiệu hiệu quả: tên + học vấn + 1-2 thành tích cụ thể + lý do phù hợp với vị trí này. Tránh quá chung chung.',
      keyTakeaway: 'Câu trả lời quá ngắn và thiếu cụ thể. Cần thêm thành tích và dự án liên quan.',
      promptVersion: 'feedback-v1.3',
      segments: [
        {
          segmentText: 'muốn đóng góp cho team',
          startIndex: 78,
          endIndex: 99,
          highlightLevel: 'warning',
          annotation: 'Quá chung chung. "Đóng góp" như thế nào?',
          suggestion: 'Nêu cụ thể: "Tôi muốn đóng góp bằng cách viết UI components chuẩn accessibility và hỗ trợ tối ưu Core Web Vitals"',
        },
      ],
    },
  });

  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[1],
    answerText: 'Điểm yếu của tôi là đôi khi hay perfectionist, muốn code hoàn hảo nên mất nhiều thời gian. Tôi đang cải thiện bằng cách đặt time-box cho mỗi task.',
    feedbackGenerated: true,
    feedback: {
      overallScore: 70,
      modelAnswer: 'Câu trả lời về điểm yếu tốt khi: nêu điểm yếu thật (không phải fake-weakness), giải thích impact, và mô tả bước cải thiện cụ thể đang thực hiện.',
      keyTakeaway: 'Cấu trúc tốt. Cần thêm ví dụ cụ thể về lần perfectionism gây ra vấn đề gì.',
      promptVersion: 'feedback-v1.3',
      segments: [
        {
          segmentText: 'đặt time-box cho mỗi task',
          startIndex: 110,
          endIndex: 135,
          highlightLevel: 'good',
          annotation: 'Giải pháp cụ thể và thực tế.',
        },
      ],
    },
  });

  console.log('sessions: S2 seeded (completed·VN·hr·score=65)');
}

// ═══════════════════════════════════════════════════════════════════════════
// S3 — completed · Western · technical · score 88 · high performance
// ═══════════════════════════════════════════════════════════════════════════
async function seedS3(prisma: PrismaClient, userId: string): Promise<void> {
  if (await alreadySeeded(prisma, userId, 'SEED-S3')) return;

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      jobDescription: JDS.s3,
      jdSource: 'paste',
      jobTitle: 'Junior Full-Stack Developer',
      sessionType: 'technical',
      numQuestions: 3,
      difficulty: 'hard',
      persona: 'neutral_tech_lead',
      language: 'en',
      contextPackId: 'Western',
      status: 'completed',
      showPrepCard: true,
      overallScore: 88,
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      selfEvalJson: {
        confidence: 5,
        clarity: 4,
        depth: 5,
        overall: 5,
        notes: 'Felt very prepared. The system design question was challenging but I think I covered the key points.',
      },
      executiveSummaryJson: {
        headline: 'Strong technical candidate with solid foundational knowledge and practical experience.',
        strengths: ['Deep REST API understanding', 'Clear debugging methodology', 'Excellent system design thinking'],
        improvements: ['Minor: could mention observability/monitoring in system design'],
        overallVerdict: 'Ready for technical interviews at junior to mid level.',
      },
      competencyHeatmapJson: {
        TD1: 90,
        TD2: 88,
        TD3: 85,
        TD4: 88,
        TD5: 90,
      },
      actionPlanJson: {
        immediate: ['Practice one system design question per day for 2 weeks'],
        shortTerm: ['Add observability and monitoring to your system design answers'],
        resources: ['System Design Interview by Alex Xu', 'Designing Data-Intensive Applications'],
      },
    },
  });

  const qs = await pickQuestions(prisma, 'technical', 'Western', 3, 0);
  const sqIds = await Promise.all(qs.map((q, i) => createSQ(prisma, session.id, q, i)));

  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[0],
    answerText: 'REST stands for Representational State Transfer. It is an architectural style for building APIs on top of HTTP. Key characteristics: (1) Stateless — each request must contain all needed information, no session stored server-side. (2) Uniform interface — resources identified by URIs, manipulated via standard HTTP methods (GET, POST, PUT, PATCH, DELETE). (3) Client-server separation — decouples UI from data storage. (4) Cacheable — responses can be cached to improve performance. REST is popular because it is simple, language-agnostic, works over existing HTTP infrastructure, and easy to test with tools like Postman.',
    feedbackGenerated: true,
    feedback: {
      overallScore: 92,
      modelAnswer: 'REST (Representational State Transfer) has 6 constraints: client-server, stateless, cacheable, uniform interface, layered system, code-on-demand (optional). Popularity stems from: leverages existing HTTP, massive tooling ecosystem, language-agnostic, and easy to understand.',
      keyTakeaway: 'Excellent answer. Add "layered system" constraint for completeness.',
      promptVersion: 'feedback-v1.3',
      segments: [
        {
          segmentText: 'Stateless — each request must contain all needed information, no session stored server-side',
          startIndex: 145,
          endIndex: 234,
          highlightLevel: 'good',
          annotation: 'Precise and complete definition of statelessness.',
        },
        {
          segmentText: 'easy to test with tools like Postman',
          startIndex: 490,
          endIndex: 526,
          highlightLevel: 'good',
          annotation: 'Good practical context — shows real-world awareness.',
        },
      ],
    },
  });

  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[1],
    answerText: 'My debugging process: (1) Reproduce consistently — confirm the bug is reproducible and understand when it happens. (2) Isolate — narrow down the scope using binary search on code (commenting out halves). (3) Read error messages carefully — stack traces often point to the exact line. (4) Check recent changes with git log/git bisect. (5) Add strategic console.log or use the debugger (Node.js --inspect). (6) Form hypotheses and test one at a time. (7) Fix and add a regression test. Most bugs I have found were either off-by-one errors, null derefs, or async timing issues.',
    feedbackGenerated: true,
    feedback: {
      overallScore: 88,
      modelAnswer: 'A strong debug workflow: reproduce → isolate → hypothesize → test → fix → regression test. Good candidates mention specific tools (debugger, git bisect, profiler) and common bug classes they watch for.',
      keyTakeaway: 'Excellent structured approach. Mention of git bisect and regression testing shows maturity.',
      promptVersion: 'feedback-v1.3',
      segments: [
        {
          segmentText: 'binary search on code (commenting out halves)',
          startIndex: 112,
          endIndex: 156,
          highlightLevel: 'good',
          annotation: 'Binary search debugging is an efficient and underrated technique.',
        },
        {
          segmentText: 'add a regression test',
          startIndex: 450,
          endIndex: 471,
          highlightLevel: 'good',
          annotation: 'Closing the loop with a test is a mark of a disciplined engineer.',
        },
      ],
    },
  });

  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[2],
    answerText: 'For a URL shortener: Data model — a "links" table with columns: id (auto-increment), short_code (varchar 7, unique, indexed), original_url (text), created_at, expires_at (nullable), click_count (int). Short code generation: take base62 encoding of the auto-increment ID (a-z, A-Z, 0-9) which gives ~3.5 trillion combinations at 7 chars. Collision handling is implicit since IDs are unique. For scale: read replicas for the redirect endpoint (high read:write ratio), cache top 1% links in Redis (LRU), and use a CDN for static content. The redirect endpoint (GET /{code}) should return 301 or 302.',
    feedbackGenerated: true,
    feedback: {
      overallScore: 85,
      modelAnswer: 'Good system design covers: functional requirements (shorten, redirect, analytics), non-functional (low latency for redirect, high availability), data model, short code generation strategy, and scaling considerations (caching, read replicas, CDN).',
      keyTakeaway: 'Solid answer. Add: 301 vs 302 tradeoff discussion (caching vs analytics), and mention rate limiting for abuse prevention.',
      promptVersion: 'feedback-v1.3',
      segments: [
        {
          segmentText: 'base62 encoding of the auto-increment ID',
          startIndex: 230,
          endIndex: 270,
          highlightLevel: 'good',
          annotation: 'Elegant collision-free approach — correctly identified.',
        },
        {
          segmentText: 'cache top 1% links in Redis (LRU)',
          startIndex: 380,
          endIndex: 413,
          highlightLevel: 'good',
          annotation: 'Correct optimization — URL shorteners have a heavy-tail access pattern.',
        },
      ],
    },
  });

  console.log('sessions: S3 seeded (completed·Western·technical·score=88)');
}

// ═══════════════════════════════════════════════════════════════════════════
// S4 — active · VN · hr · partially answered (2/4 done)
// ═══════════════════════════════════════════════════════════════════════════
async function seedS4(prisma: PrismaClient, userId: string): Promise<void> {
  if (await alreadySeeded(prisma, userId, 'SEED-S4')) return;

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      jobDescription: JDS.s4,
      jdSource: 'paste',
      jobTitle: 'Junior Software Engineer',
      sessionType: 'hr',
      numQuestions: 4,
      difficulty: 'medium',
      persona: 'neutral_tech_lead',
      language: 'vi',
      contextPackId: 'VN',
      status: 'active',
      showPrepCard: false,
      openingTranscript: 'Xin chào! Chúng ta bắt đầu buổi phỏng vấn HR nhé. Tôi sẽ hỏi bạn 4 câu hỏi về kinh nghiệm và kỹ năng.',
    },
  });

  const qs = await pickQuestions(prisma, 'hr', 'VN', 4, 2);
  const sqIds = await Promise.all(qs.map((q, i) => createSQ(prisma, session.id, q, i)));

  // First 2 answered with feedback
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[0],
    answerText: 'Tôi thích làm việc nhóm hơn vì tôi học được nhiều từ đồng đội. Khi làm nhóm dự án cuối khóa, tôi đảm nhận phần backend và phối hợp với bạn làm frontend qua Git.',
    feedbackGenerated: true,
    feedback: {
      overallScore: 72,
      modelAnswer: 'Câu trả lời cân bằng: nêu preference + lý do thực tế + ví dụ cụ thể. Thể hiện khả năng thích nghi với cả hai bối cảnh.',
      keyTakeaway: 'Tốt, nhưng nên thêm ví dụ về lần làm việc độc lập thành công để cho thấy tính linh hoạt.',
      promptVersion: 'feedback-v1.3',
      segments: [
        {
          segmentText: 'phối hợp với bạn làm frontend qua Git',
          startIndex: 120,
          endIndex: 157,
          highlightLevel: 'good',
          annotation: 'Ví dụ cụ thể và thực tế.',
        },
      ],
    },
  });

  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[1],
    answerText: 'Môi trường tôi muốn là nơi có văn hóa học hỏi, đồng nghiệp sẵn sàng giúp đỡ nhau, và có cơ hội được mentor bởi senior. Tôi không thích môi trường chỉ làm theo chỉ thị mà không có sự sáng tạo.',
    feedbackGenerated: true,
    feedback: {
      overallScore: 68,
      modelAnswer: 'Mô tả môi trường lý tưởng: nêu giá trị cụ thể (learning culture, feedback loops, psychological safety) và kết nối với công ty đang ứng tuyển.',
      keyTakeaway: 'Câu trả lời chân thực. Cần kết nối với văn hóa của công ty đang apply để thể hiện research.',
      promptVersion: 'feedback-v1.3',
      segments: [
        {
          segmentText: 'cơ hội được mentor bởi senior',
          startIndex: 80,
          endIndex: 109,
          highlightLevel: 'good',
          annotation: 'Mong muốn phát triển qua mentorship — đánh giá cao ở junior.',
        },
      ],
    },
  });

  // Q3 and Q4: questions created but not yet answered (in-progress session)

  console.log('sessions: S4 seeded (active·VN·hr·2/4 answered)');
}

// ═══════════════════════════════════════════════════════════════════════════
// S5 — generating · VN · mixed · no questions yet
// ═══════════════════════════════════════════════════════════════════════════
async function seedS5(prisma: PrismaClient, userId: string): Promise<void> {
  if (await alreadySeeded(prisma, userId, 'SEED-S5')) return;

  await prisma.interviewSession.create({
    data: {
      userId,
      jobDescription: JDS.s5,
      jdSource: 'paste',
      jobTitle: 'Backend Intern',
      sessionType: 'mixed',
      numQuestions: 5,
      difficulty: 'easy',
      persona: 'neutral_tech_lead',
      language: 'vi',
      contextPackId: 'VN',
      status: 'generating',
      showPrepCard: false,
    },
  });

  console.log('sessions: S5 seeded (generating·VN·mixed·no questions)');
}

// ═══════════════════════════════════════════════════════════════════════════
// S6 — completed · VN · mixed · audio + skip + follow-up + reverse question
// ═══════════════════════════════════════════════════════════════════════════
async function seedS6(prisma: PrismaClient, userId: string): Promise<void> {
  if (await alreadySeeded(prisma, userId, 'SEED-S6')) return;

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      jobDescription: JDS.s6,
      jdSource: 'paste',
      jobTitle: 'Junior Mobile Developer',
      sessionType: 'mixed',
      numQuestions: 3,
      difficulty: 'medium',
      persona: 'neutral_tech_lead',
      language: 'vi',
      contextPackId: 'VN',
      status: 'completed',
      showPrepCard: true,
      overallScore: 74,
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      selfEvalJson: {
        confidence: 3,
        clarity: 3,
        depth: 3,
        overall: 3,
        notes: 'Câu trả lời audio bị run giọng một chút, cần luyện tập thêm.',
      },
      executiveSummaryJson: {
        headline: 'Ứng viên có kỹ năng kỹ thuật tốt, thể hiện tốt qua câu trả lời đầu tiên.',
        strengths: ['Hiểu rõ Git workflow', 'Thái độ thành thật'],
        improvements: ['Cần tự tin hơn khi trả lời audio', 'Không nên bỏ qua câu hỏi'],
        overallVerdict: 'Tiềm năng, cần cải thiện phong cách trình bày.',
      },
      competencyHeatmapJson: {
        D1: 72, D2: 78, D3: 70, D4: 76, D5: 68, D6: 74,
        TD1: 75, TD2: 72, TD3: 70, TD4: 68, TD5: 75,
      },
      reverseQEvalJson: {
        asked: 1,
        quality: 'good',
        evaluation: 'Câu hỏi thể hiện sự chuẩn bị và quan tâm đến culture công ty.',
      },
      actionPlanJson: {
        immediate: ['Luyện nói to câu trả lời 5 phút mỗi ngày', 'Không bỏ câu hỏi — nếu không biết, nói ra suy nghĩ ban đầu'],
        shortTerm: ['Mock interview có ghi âm để review'],
        resources: ['Ứng dụng luyện nói: Speeko'],
      },
    },
  });

  const qs = await pickQuestions(prisma, 'mixed', 'VN', 3, 3);
  const sqIds = await Promise.all(qs.map((q, i) => createSQ(prisma, session.id, q, i)));

  // Q1: audio answer với voice metrics + follow-up được trả lời
  const a1 = await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[0],
    answerText: 'Tôi thường sử dụng Git flow với các branch feature, develop và main. Khi bắt đầu task, tôi tạo branch mới từ develop, code xong thì tạo pull request và yêu cầu code review từ teammate.',
    answerMode: 'audio',
    audioFileUrl: 'https://storage.example.com/seed/audio-s6-q1.webm',
    audioDurationSeconds: 42,
    audioSizeBytes: 210000,
    voiceMetricsJson: {
      wordsPerMinute: 118,
      pauseCount: 3,
      fillerWords: ['ừm', 'thì'],
      fillerWordCount: 4,
      sentenceCount: 3,
      avgSentenceWords: 22,
    },
    feedbackGenerated: true,
    feedback: {
      overallScore: 78,
      modelAnswer: 'Git workflow hoàn chỉnh: feature branch → PR → code review → merge to develop → test → release to main. Nêu cả commit message convention và squash merge policy sẽ tốt hơn.',
      keyTakeaway: 'Câu trả lời đúng và đủ. Thêm chi tiết về commit message convention sẽ thể hiện professionalism.',
      promptVersion: 'feedback-v1.3',
      segments: [
        {
          segmentText: 'yêu cầu code review từ teammate',
          startIndex: 150,
          endIndex: 181,
          highlightLevel: 'good',
          annotation: 'Code review là best practice quan trọng — tốt khi đề cập.',
        },
      ],
    },
  });

  await createFollowUp(prisma, {
    userAnswerId: a1,
    followUpText: 'Khi nhận được review comments từ teammate, bạn xử lý thế nào nếu bạn không đồng ý với comment đó?',
    triggerRule: 'depth_probe',
    triggerReason: 'Ứng viên đề cập code review nhưng chưa nói đến cách xử lý conflict trong review.',
    followUpAnswerText: 'Tôi sẽ giải thích lý do kỹ thuật của mình trong comment, nếu vẫn không đồng ý thì đề nghị discuss trực tiếp để hiểu nhau hơn. Quyết định cuối theo senior hoặc team lead.',
  });

  // Q2: skipped answer
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[1],
    answerText: '',
    skipped: true,
    feedbackGenerated: false,
  });

  // Q3: text answer, lower score
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[2],
    answerText: 'Tôi chọn IT vì thích giải quyết vấn đề và thích xây dựng những thứ có thể dùng được. Khi nhìn thấy app mình làm được người khác dùng là cảm thấy rất có ý nghĩa.',
    feedbackGenerated: true,
    feedback: {
      overallScore: 70,
      modelAnswer: 'Câu trả lời về động lực tốt khi kết hợp: passion thực sự + impact cụ thể bạn muốn tạo ra + liên kết với role đang ứng tuyển.',
      keyTakeaway: 'Chân thực và dễ gần. Cần kết nối cụ thể hơn với vị trí Mobile Developer đang apply.',
      promptVersion: 'feedback-v1.3',
      segments: [
        {
          segmentText: 'thích giải quyết vấn đề',
          startIndex: 10,
          endIndex: 33,
          highlightLevel: 'warning',
          annotation: '"Thích giải quyết vấn đề" là cliché phổ biến. Hãy nêu loại vấn đề cụ thể bạn thích.',
          suggestion: 'Thêm ví dụ: "tôi thích giải quyết bài toán UI performance — tối ưu render time từ 3s xuống 0.8s trong dự án X"',
        },
      ],
    },
  });

  // Reverse question — candidate asked interviewer
  await prisma.reverseQuestion.create({
    data: {
      sessionId: session.id,
      questionText: 'Team sử dụng quy trình Agile như thế nào? Sprint length bao nhiêu ngày và có retrospective không?',
      answerMode: 'text',
      orderIndex: 0,
      aiResponse: 'Đây là câu hỏi rất tốt! Chúng tôi dùng Scrum với 2-week sprint, có daily standup, sprint review và retrospective. Bạn sẽ được pair với một senior developer trong 3 tháng đầu.',
      evaluationLabel: 'excellent',
      evaluationComment: 'Câu hỏi thể hiện sự quan tâm đến process và culture — dấu hiệu của ứng viên có tư duy team player.',
    },
  });

  console.log('sessions: S6 seeded (completed·VN·mixed·audio+skip+followup+reverseQ)');
}

// ═══════════════════════════════════════════════════════════════════════════
// S7 — completed · Western · mixed · fallback feedback · low score 42
// ═══════════════════════════════════════════════════════════════════════════
async function seedS7(prisma: PrismaClient, userId: string): Promise<void> {
  if (await alreadySeeded(prisma, userId, 'SEED-S7')) return;

  const session = await prisma.interviewSession.create({
    data: {
      userId,
      jobDescription: JDS.s7,
      jdSource: 'paste',
      jobTitle: 'Junior DevOps Engineer',
      sessionType: 'mixed',
      numQuestions: 3,
      difficulty: 'medium',
      persona: 'neutral_tech_lead',
      language: 'en',
      contextPackId: 'Western',
      status: 'completed',
      showPrepCard: false,
      overallScore: 42,
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      selfEvalJson: {
        confidence: 1,
        clarity: 2,
        depth: 1,
        overall: 1,
        notes: 'Felt completely unprepared. Need much more practice before actual interviews.',
      },
      executiveSummaryJson: {
        headline: 'Significant preparation needed before interviewing at this level.',
        strengths: ['Honest about knowledge gaps'],
        improvements: [
          'Study STAR method and practice behavioral questions',
          'Build stronger technical foundation before applying',
          'Prepare specific examples from past projects',
        ],
        overallVerdict: 'Not ready for this role. Recommend 2-3 months of targeted preparation.',
      },
      commAnalysisJson: {
        clarityScore: 38,
        structureScore: 30,
        concisenessScore: 45,
        vocabularyRichness: 40,
        fillerWordCount: 28,
        avgSentenceLength: 9,
      },
      competencyHeatmapJson: {
        D1: 35, D2: 45, D3: 40, D4: 50, D5: 42, D6: 38,
        TD1: 40, TD2: 38, TD3: 35, TD4: 45, TD5: 42,
      },
      actionPlanJson: {
        immediate: [
          'Spend 1 hour daily on interview prep for 60 days',
          'Study STAR method — write 5 complete stories',
          'Build a simple DevOps project: Docker + CI/CD pipeline',
        ],
        shortTerm: [
          'Complete a Linux fundamentals course',
          'Get familiar with at least one cloud provider (AWS/GCP free tier)',
        ],
        resources: [
          'The DevOps Handbook',
          'Linux Journey (linuxjourney.com)',
          'AWS Free Tier + Cloud Practitioner exam',
        ],
      },
    },
  });

  const qs = await pickQuestions(prisma, 'mixed', 'Western', 3, 3);
  const sqIds = await Promise.all(qs.map((q, i) => createSQ(prisma, session.id, q, i)));

  // All 3 answers: short, vague, low scores, fallback feedback

  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[0],
    answerText: "I don't really know, I just like computers. I'm good at figuring things out.",
    feedbackGenerated: true,
    feedback: {
      overallScore: 35,
      isFallback: true,
      modelAnswer: 'A strong answer explains: what drew you to this specific role, a concrete past experience, and what impact you want to create. Use the STAR framework for any experience-based question.',
      keyTakeaway: 'Answer is too vague. No specific examples or connection to the role.',
      promptVersion: 'feedback-v1.3-fallback',
      segments: [
        {
          segmentText: "I don't really know",
          startIndex: 0,
          endIndex: 19,
          highlightLevel: 'critical',
          annotation: 'Starting with uncertainty signals lack of preparation. Always have a clear answer for motivation questions.',
          suggestion: 'Replace with a specific story: "I got into DevOps after spending 3 days debugging a production outage — I realized I wanted to build the systems that prevent those."',
        },
      ],
    },
  });

  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[1],
    answerText: "I usually just Google it or ask someone. I'm not sure what else to say.",
    feedbackGenerated: true,
    feedback: {
      overallScore: 40,
      isFallback: true,
      modelAnswer: 'Describe a structured debug process: reproduce → isolate → hypothesize → verify → fix → prevent. Mention specific tools you use (logs, debugger, git bisect).',
      keyTakeaway: 'Googling and asking are valid tactics but not a complete answer. Show your systematic thinking.',
      promptVersion: 'feedback-v1.3-fallback',
      segments: [
        {
          segmentText: 'I usually just Google it',
          startIndex: 0,
          endIndex: 23,
          highlightLevel: 'warning',
          annotation: 'Valid but incomplete. Everyone Googles — what makes you different is your systematic approach.',
        },
        {
          segmentText: "I'm not sure what else to say",
          startIndex: 38,
          endIndex: 66,
          highlightLevel: 'critical',
          annotation: 'Never trail off in an interview. If unsure, say: "Let me think through this systematically..." and walk through the steps.',
        },
      ],
    },
  });

  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[2],
    answerText: 'I worked on a group project at school but it was just a simple website. Nothing special.',
    feedbackGenerated: true,
    feedback: {
      overallScore: 38,
      isFallback: true,
      modelAnswer: 'Use STAR: Situation (context of the project), Task (your specific role), Action (concrete steps you took), Result (measurable outcome). Even simple projects become compelling with structure.',
      keyTakeaway: '"Nothing special" is a missed opportunity. Every project has a story — find the interesting decision or challenge within it.',
      promptVersion: 'feedback-v1.3-fallback',
      segments: [
        {
          segmentText: 'Nothing special',
          startIndex: 72,
          endIndex: 87,
          highlightLevel: 'critical',
          annotation: 'Self-deprecating language hurts your candidacy. Reframe: what was the most interesting technical challenge, even in a simple project?',
          suggestion: 'Replace with: "We built a simple e-commerce site — the most interesting challenge was designing the database schema for product variants."',
        },
      ],
    },
  });

  console.log('sessions: S7 seeded (completed·Western·mixed·fallback·score=42)');
}

// ═══════════════════════════════════════════════════════════════════════════
// Orchestrator
// ═══════════════════════════════════════════════════════════════════════════
export async function seedSessions(prisma: PrismaClient, userId: string): Promise<void> {
  await seedS1(prisma, userId);
  await seedS2(prisma, userId);
  await seedS3(prisma, userId);
  await seedS4(prisma, userId);
  await seedS5(prisma, userId);
  await seedS6(prisma, userId);
  await seedS7(prisma, userId);
}
