import type { PrismaClient, QuestionBank } from '@prisma/client';
import { createAnswerWithFeedback, segAt } from './_helpers';

// ─── Job descriptions (one per session) ─────────────────────────────────────

const JDS = {
  s1: 'Công ty TNHH VietTech Solutions (50 nhân sự, ngành Fintech) tuyển Junior Backend Developer. Công việc: phát triển và bảo trì REST API bằng NestJS + TypeScript, thiết kế PostgreSQL schema, viết unit/integration test với Jest, tham gia code review hàng tuần trong team 8 người. Yêu cầu: Node.js, TypeScript, PostgreSQL, Git, hiểu HTTP/REST; 0–1 năm kinh nghiệm hoặc đã build project cá nhân. Đãi ngộ: 8–12 triệu/tháng, remote 2 ngày/tuần, mentorship bởi senior engineer.',
  s2: 'Startup EdTech GrowLearn (30 nhân sự) tuyển Junior Frontend Developer để phát triển nền tảng học trực tuyến. Công việc: xây dựng giao diện React/Next.js 14, tích hợp REST API, tối ưu Core Web Vitals, làm việc sát designer qua Figma. Yêu cầu: React 18+, TypeScript, Tailwind CSS, hiểu cơ bản về accessibility; 0–1 năm kinh nghiệm. Đãi ngộ: 7–11 triệu/tháng, hybrid 3 ngày/tuần tại HCM, stock option sau 1 năm.',
  s3: 'BuildFast Inc. (Series A, 80 employees, SaaS for construction management) is hiring a Junior Full-Stack Developer. Role: build and maintain React frontend and Node.js/Express backend, integrate third-party APIs (Stripe, Twilio), write automated tests with Jest and Playwright. Requirements: TypeScript, REST API design, PostgreSQL, Git; 0–1 year of experience or strong portfolio projects. Compensation: $55,000–$70,000/year, fully remote (US timezones), $1,000 home office stipend.',
  s4: 'FPT Software (Đà Nẵng, 2000+ nhân sự) tuyển Junior Software Engineer cho team sản phẩm nội địa. Công việc: làm việc trong team Agile 6 người, tham gia toàn bộ vòng đời feature từ spec đến deployment, báo cáo tiến độ daily standup. Yêu cầu: tốt nghiệp CNTT hoặc ngành liên quan, biết ít nhất một ngôn ngữ backend (Java/Node.js/Python), kỹ năng giao tiếp tốt và chủ động. Đãi ngộ: 9–14 triệu/tháng, 13 tháng lương, lộ trình thăng tiến rõ ràng.',
  s5: 'Rikkeisoft (Hà Nội, 1200+ nhân sự) tuyển Backend Intern cho team Data Platform. Công việc: hỗ trợ team xây dựng API bằng Python/FastAPI, viết script ETL đơn giản, tham gia code review và daily standup. Yêu cầu: Python cơ bản, SQL cơ bản, hiểu HTTP request/response; đang học năm 3–4 hoặc mới tốt nghiệp. Đãi ngộ: 3–5 triệu/tháng, thực tập 3 tháng, xét chuyển chính thức nếu đáp ứng KPI.',
  s6: 'Công ty Giải pháp Số ANZ (Hà Nội, 120 nhân sự) tuyển Junior Mobile Developer cho ứng dụng thanh toán nội địa. Công việc: phát triển app React Native cross-platform iOS/Android, tích hợp payment gateway nội địa (MoMo, ZaloPay), viết unit test bằng Jest, submit lên App Store và Google Play. Yêu cầu: JavaScript/TypeScript, React Native, hiểu REST API và async programming; 0–1 năm kinh nghiệm; ưu tiên có app cá nhân trên store. Đãi ngộ: 9–13 triệu/tháng, thưởng theo dự án, hybrid 4 ngày/tuần tại Hà Nội.',
  s7: 'Meridian Cloud (Series B, 150 employees, infrastructure tooling) is hiring a Junior DevOps / Platform Engineer. Role: maintain CI/CD pipelines (GitHub Actions, Jenkins), containerize services with Docker and deploy on Kubernetes (GKE), write Terraform modules for GCP infrastructure, on-call rotation once onboarded. Requirements: Linux command line, Docker, basic scripting (Bash or Python), strong written communication; prior internship or personal homelab experience welcome. Compensation: $65,000–$80,000/year, remote-first (EST/CST), health + dental + 401k, $500 learning budget per year.',
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
  if (sessionType === 'mixed') {
    const hrTake = Math.ceil(take / 2);
    const techTake = Math.floor(take / 2);
    const [hrQuestions, techQuestions] = await Promise.all([
      prisma.questionBank.findMany({
        where: { sessionType: 'hr', contextPackId },
        orderBy: [{ difficulty: 'asc' }, { content: 'asc' }],
        take: hrTake,
        skip,
      }),
      prisma.questionBank.findMany({
        where: { sessionType: 'technical', contextPackId },
        orderBy: [{ difficulty: 'asc' }, { content: 'asc' }],
        take: techTake,
        skip,
      }),
    ]);
    return [...hrQuestions, ...techQuestions];
  }

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
    where: { userId, openingTranscript: { contains: marker } },
    select: { id: true },
  });
  return s !== null;
}

// ═══════════════════════════════════════════════════════════════════════════
// S1 — completed · VN · mixed · score 72 · text answers · full feedback
// ═══════════════════════════════════════════════════════════════════════════
async function seedS1(prisma: PrismaClient, userId: string): Promise<string> {
  if (await alreadySeeded(prisma, userId, 'SEED-S1')) return '';

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
      openingTranscript:
        'Xin chào! Tôi là AI Interviewer. Hôm nay chúng ta sẽ thực hiện buổi phỏng vấn thử cho vị trí Junior Backend Developer. Bạn có khoảng 30 phút. Hãy thoải mái và trả lời thật tự nhiên nhé. [SEED-S1]',
      overallScore: 72,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const qs = await pickQuestions(prisma, 'mixed', 'VN', 3, 0);
  const sqIds = await Promise.all(
    qs.map((q, i) => createSQ(prisma, session.id, q, i)),
  );

  // Q1: text answer, good score, 2 segments
  const a1Text =
    'Tôi là Nguyễn Văn Demo, vừa tốt nghiệp CNTT tại Bách Khoa Hà Nội. Trong quá trình học, tôi đã tự học NestJS và xây dựng một hệ thống quản lý task nhỏ. Tôi có kinh nghiệm với TypeScript, PostgreSQL và Git.';
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[0],
    answerText: a1Text,
    feedbackGenerated: true,
    feedback: {
      overallScore: 75,
      modelAnswer:
        'Một câu giới thiệu tốt nên bao gồm: tên, background học vấn, dự án nổi bật kèm kết quả cụ thể, và mục tiêu ngắn hạn. Ví dụ: "Tôi đã xây dựng hệ thống X phục vụ Y người dùng, đạt Z % uptime."',
      keyTakeaway: 'Cần thêm kết quả đo lường được vào phần giới thiệu dự án.',
      promptVersion: 'feedback-v1.3',
      segments: [
        segAt(a1Text, 'vừa tốt nghiệp CNTT tại Bách Khoa Hà Nội', {
          highlightLevel: 'good',
          annotation: 'Nêu rõ xuất xứ học vấn — tốt.',
        }),
        segAt(a1Text, 'xây dựng một hệ thống quản lý task nhỏ', {
          highlightLevel: 'warning',
          annotation: 'Dự án được đề cập nhưng thiếu số liệu cụ thể.',
          suggestion:
            'Thêm: số người dùng, tính năng nổi bật, hoặc kết quả đạt được.',
          improvedVersion:
            'xây dựng hệ thống quản lý task cho 20 người dùng, hỗ trợ real-time notification qua WebSocket',
        }),
      ],
    },
  });

  // Q2: text answer, medium score
  const a2Text =
    'Tôi nghĩ việc học công nghệ mới quan trọng vì ngành IT thay đổi rất nhanh. Tôi hay đọc documentation và làm theo tutorial rồi build project nhỏ để thực hành.';
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[1],
    answerText: a2Text,
    feedbackGenerated: true,
    feedback: {
      overallScore: 68,
      modelAnswer:
        'Câu trả lời tốt nên nêu: phương pháp học cụ thể (spaced repetition, building projects, reading docs), ví dụ công nghệ gần nhất bạn học, và kết quả bạn đạt được từ việc tự học đó.',
      keyTakeaway:
        'Cần cụ thể hơn về tên công nghệ và thành quả đạt được khi tự học.',
      promptVersion: 'feedback-v1.3',
      segments: [
        segAt(a2Text, 'đọc documentation và làm theo tutorial', {
          highlightLevel: 'good',
          annotation: 'Phương pháp học đúng đắn.',
        }),
        segAt(a2Text, 'build project nhỏ để thực hành', {
          highlightLevel: 'good',
          annotation: 'Học qua thực hành là cách tốt nhất.',
        }),
      ],
    },
  });

  // Q3: text, higher score
  const a3Text =
    'REST là architectural style cho phép communication giữa client và server qua HTTP. Các đặc điểm chính gồm: stateless (mỗi request độc lập), uniform interface (dùng standard HTTP methods GET/POST/PUT/DELETE), client-server separation, và cacheable responses. REST phổ biến vì đơn giản, scalable và dễ test.';
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[2],
    answerText: a3Text,
    feedbackGenerated: true,
    feedback: {
      overallScore: 82,
      modelAnswer:
        'REST (Representational State Transfer) là architectural style với 6 constraints: client-server, stateless, cacheable, uniform interface, layered system, code-on-demand (optional). Phổ biến vì: simplicity, scalability, language-agnostic, và HTTP ecosystem support.',
      keyTakeaway:
        'Câu trả lời vững. Bổ sung thêm constraint "layered system" sẽ hoàn chỉnh hơn.',
      promptVersion: 'feedback-v1.3',
      segments: [
        segAt(a3Text, 'stateless (mỗi request độc lập)', {
          highlightLevel: 'good',
          annotation: 'Giải thích đúng và ngắn gọn.',
        }),
        segAt(a3Text, 'dùng standard HTTP methods GET/POST/PUT/DELETE', {
          highlightLevel: 'good',
          annotation: 'Nêu đúng các HTTP methods tiêu chuẩn.',
        }),
      ],
    },
  });

  console.log('sessions: S1 seeded (completed·VN·mixed·score=72)');
  return session.id;
}

// ═══════════════════════════════════════════════════════════════════════════
// S2 — completed · VN · hr · score 65 · text answers
// ═══════════════════════════════════════════════════════════════════════════
async function seedS2(prisma: PrismaClient, userId: string): Promise<string> {
  if (await alreadySeeded(prisma, userId, 'SEED-S2')) return '';

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
      openingTranscript: '[SEED-S2]',
      overallScore: 65,
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  const qs = await pickQuestions(prisma, 'hr', 'VN', 2, 0);
  const sqIds = await Promise.all(
    qs.map((q, i) => createSQ(prisma, session.id, q, i)),
  );

  const s2q1Text =
    'Tôi là sinh viên vừa tốt nghiệp, hiện đang tìm công việc đầu tiên. Tôi thích làm việc với con người và muốn đóng góp cho team.';
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[0],
    answerText: s2q1Text,
    feedbackGenerated: true,
    feedback: {
      overallScore: 60,
      modelAnswer:
        'Câu tự giới thiệu hiệu quả: tên + học vấn + 1-2 thành tích cụ thể + lý do phù hợp với vị trí này. Tránh quá chung chung.',
      keyTakeaway:
        'Câu trả lời quá ngắn và thiếu cụ thể. Cần thêm thành tích và dự án liên quan.',
      promptVersion: 'feedback-v1.3',
      segments: [
        segAt(s2q1Text, 'muốn đóng góp cho team', {
          highlightLevel: 'warning',
          annotation: 'Quá chung chung. "Đóng góp" như thế nào?',
          suggestion:
            'Nêu cụ thể: "Tôi muốn đóng góp bằng cách viết UI components chuẩn accessibility và hỗ trợ tối ưu Core Web Vitals"',
        }),
      ],
    },
  });

  const s2q2Text =
    'Điểm yếu của tôi là đôi khi hay perfectionist, muốn code hoàn hảo nên mất nhiều thời gian. Tôi đang cải thiện bằng cách đặt time-box cho mỗi task.';
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[1],
    answerText: s2q2Text,
    feedbackGenerated: true,
    feedback: {
      overallScore: 70,
      modelAnswer:
        'Câu trả lời về điểm yếu tốt khi: nêu điểm yếu thật (không phải fake-weakness), giải thích impact, và mô tả bước cải thiện cụ thể đang thực hiện.',
      keyTakeaway:
        'Cấu trúc tốt. Cần thêm ví dụ cụ thể về lần perfectionism gây ra vấn đề gì.',
      promptVersion: 'feedback-v1.3',
      segments: [
        segAt(s2q2Text, 'đặt time-box cho mỗi task', {
          highlightLevel: 'good',
          annotation: 'Giải pháp cụ thể và thực tế.',
        }),
      ],
    },
  });

  console.log('sessions: S2 seeded (completed·VN·hr·score=65)');
  return session.id;
}

// ═══════════════════════════════════════════════════════════════════════════
// S3 — completed · Western · technical · score 88 · high performance
// ═══════════════════════════════════════════════════════════════════════════
async function seedS3(prisma: PrismaClient, userId: string): Promise<string> {
  if (await alreadySeeded(prisma, userId, 'SEED-S3')) return '';

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
      openingTranscript: '[SEED-S3]',
      overallScore: 88,
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  const qs = await pickQuestions(prisma, 'technical', 'Western', 3, 0);
  const sqIds = await Promise.all(
    qs.map((q, i) => createSQ(prisma, session.id, q, i)),
  );

  const s3q1Text =
    'REST stands for Representational State Transfer. It is an architectural style for building APIs on top of HTTP. Key characteristics: (1) Stateless — each request must contain all needed information, no session stored server-side. (2) Uniform interface — resources identified by URIs, manipulated via standard HTTP methods (GET, POST, PUT, PATCH, DELETE). (3) Client-server separation — decouples UI from data storage. (4) Cacheable — responses can be cached to improve performance. REST is popular because it is simple, language-agnostic, works over existing HTTP infrastructure, and easy to test with tools like Postman.';
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[0],
    answerText: s3q1Text,
    feedbackGenerated: true,
    feedback: {
      overallScore: 92,
      modelAnswer:
        'REST (Representational State Transfer) has 6 constraints: client-server, stateless, cacheable, uniform interface, layered system, code-on-demand (optional). Popularity stems from: leverages existing HTTP, massive tooling ecosystem, language-agnostic, and easy to understand.',
      keyTakeaway:
        'Excellent answer. Add "layered system" constraint for completeness.',
      promptVersion: 'feedback-v1.3',
      segments: [
        segAt(
          s3q1Text,
          'Stateless — each request must contain all needed information, no session stored server-side',
          {
            highlightLevel: 'good',
            annotation: 'Precise and complete definition of statelessness.',
          },
        ),
        segAt(s3q1Text, 'easy to test with tools like Postman', {
          highlightLevel: 'good',
          annotation: 'Good practical context — shows real-world awareness.',
        }),
      ],
    },
  });

  const s3q2Text =
    'My debugging process: (1) Reproduce consistently — confirm the bug is reproducible and understand when it happens. (2) Isolate — narrow down the scope using binary search on code (commenting out halves). (3) Read error messages carefully — stack traces often point to the exact line. (4) Check recent changes with git log/git bisect. (5) Add strategic console.log or use the debugger (Node.js --inspect). (6) Form hypotheses and test one at a time. (7) Fix and add a regression test. Most bugs I have found were either off-by-one errors, null derefs, or async timing issues.';
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[1],
    answerText: s3q2Text,
    feedbackGenerated: true,
    feedback: {
      overallScore: 88,
      modelAnswer:
        'A strong debug workflow: reproduce → isolate → hypothesize → test → fix → regression test. Good candidates mention specific tools (debugger, git bisect, profiler) and common bug classes they watch for.',
      keyTakeaway:
        'Excellent structured approach. Mention of git bisect and regression testing shows maturity.',
      promptVersion: 'feedback-v1.3',
      segments: [
        segAt(s3q2Text, 'binary search on code (commenting out halves)', {
          highlightLevel: 'good',
          annotation:
            'Binary search debugging is an efficient and underrated technique.',
        }),
        segAt(s3q2Text, 'add a regression test', {
          highlightLevel: 'good',
          annotation:
            'Closing the loop with a test is a mark of a disciplined engineer.',
        }),
      ],
    },
  });

  const s3q3Text =
    'For a URL shortener: Data model — a "links" table with columns: id (auto-increment), short_code (varchar 7, unique, indexed), original_url (text), created_at, expires_at (nullable), click_count (int). Short code generation: take base62 encoding of the auto-increment ID (a-z, A-Z, 0-9) which gives ~3.5 trillion combinations at 7 chars. Collision handling is implicit since IDs are unique. For scale: read replicas for the redirect endpoint (high read:write ratio), cache top 1% links in Redis (LRU), and use a CDN for static content. The redirect endpoint (GET /{code}) should return 301 or 302.';
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[2],
    answerText: s3q3Text,
    feedbackGenerated: true,
    feedback: {
      overallScore: 85,
      modelAnswer:
        'Good system design covers: functional requirements (shorten, redirect, analytics), non-functional (low latency for redirect, high availability), data model, short code generation strategy, and scaling considerations (caching, read replicas, CDN).',
      keyTakeaway:
        'Solid answer. Add: 301 vs 302 tradeoff discussion (caching vs analytics), and mention rate limiting for abuse prevention.',
      promptVersion: 'feedback-v1.3',
      segments: [
        segAt(s3q3Text, 'base62 encoding of the auto-increment ID', {
          highlightLevel: 'good',
          annotation: 'Elegant collision-free approach — correctly identified.',
        }),
        segAt(s3q3Text, 'cache top 1% links in Redis (LRU)', {
          highlightLevel: 'good',
          annotation:
            'Correct optimization — URL shorteners have a heavy-tail access pattern.',
        }),
      ],
    },
  });

  console.log('sessions: S3 seeded (completed·Western·technical·score=88)');
  return session.id;
}

// ═══════════════════════════════════════════════════════════════════════════
// S4 — active · VN · hr · partially answered (2/4 done)
// ═══════════════════════════════════════════════════════════════════════════
async function seedS4(prisma: PrismaClient, userId: string): Promise<string> {
  if (await alreadySeeded(prisma, userId, 'SEED-S4')) return '';

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
      openingTranscript:
        'Xin chào! Chúng ta bắt đầu buổi phỏng vấn HR nhé. Tôi sẽ hỏi bạn 4 câu hỏi về kinh nghiệm và kỹ năng. [SEED-S4]',
    },
  });

  const qs = await pickQuestions(prisma, 'hr', 'VN', 4, 2);
  const sqIds = await Promise.all(
    qs.map((q, i) => createSQ(prisma, session.id, q, i)),
  );

  // First 2 answered with feedback
  const s4q1Text =
    'Tôi thích làm việc nhóm hơn vì tôi học được nhiều từ đồng đội. Khi làm nhóm dự án cuối khóa, tôi đảm nhận phần backend và phối hợp với bạn làm frontend qua Git.';
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[0],
    answerText: s4q1Text,
    feedbackGenerated: true,
    feedback: {
      overallScore: 72,
      modelAnswer:
        'Câu trả lời cân bằng: nêu preference + lý do thực tế + ví dụ cụ thể. Thể hiện khả năng thích nghi với cả hai bối cảnh.',
      keyTakeaway:
        'Tốt, nhưng nên thêm ví dụ về lần làm việc độc lập thành công để cho thấy tính linh hoạt.',
      promptVersion: 'feedback-v1.3',
      segments: [
        segAt(s4q1Text, 'phối hợp với bạn làm frontend qua Git', {
          highlightLevel: 'good',
          annotation: 'Ví dụ cụ thể và thực tế.',
        }),
      ],
    },
  });

  const s4q2Text =
    'Môi trường tôi muốn là nơi có văn hóa học hỏi, đồng nghiệp sẵn sàng giúp đỡ nhau, và có cơ hội được mentor bởi senior. Tôi không thích môi trường chỉ làm theo chỉ thị mà không có sự sáng tạo.';
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[1],
    answerText: s4q2Text,
    feedbackGenerated: true,
    feedback: {
      overallScore: 68,
      modelAnswer:
        'Mô tả môi trường lý tưởng: nêu giá trị cụ thể (learning culture, feedback loops, psychological safety) và kết nối với công ty đang ứng tuyển.',
      keyTakeaway:
        'Câu trả lời chân thực. Cần kết nối với văn hóa của công ty đang apply để thể hiện research.',
      promptVersion: 'feedback-v1.3',
      segments: [
        segAt(s4q2Text, 'cơ hội được mentor bởi senior', {
          highlightLevel: 'good',
          annotation:
            'Mong muốn phát triển qua mentorship — đánh giá cao ở junior.',
        }),
      ],
    },
  });

  // Q3 and Q4: questions created but not yet answered (in-progress session)

  console.log('sessions: S4 seeded (active·VN·hr·2/4 answered)');
  return session.id;
}

// ═══════════════════════════════════════════════════════════════════════════
// S5 — generating · VN · mixed · no questions yet
// ═══════════════════════════════════════════════════════════════════════════
async function seedS5(prisma: PrismaClient, userId: string): Promise<string> {
  if (await alreadySeeded(prisma, userId, 'SEED-S5')) return '';

  const session = await prisma.interviewSession.create({
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
      openingTranscript: '[SEED-S5]',
    },
  });

  console.log('sessions: S5 seeded (generating·VN·mixed·no questions)');
  return session.id;
}

// ═══════════════════════════════════════════════════════════════════════════
// S6 — completed · VN · mixed · audio + skip + follow-up
// ═══════════════════════════════════════════════════════════════════════════
async function seedS6(prisma: PrismaClient, userId: string): Promise<string> {
  if (await alreadySeeded(prisma, userId, 'SEED-S6')) return '';

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
      openingTranscript: '[SEED-S6]',
      overallScore: 74,
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const qs = await pickQuestions(prisma, 'mixed', 'VN', 3, 3);
  const sqIds = await Promise.all(
    qs.map((q, i) => createSQ(prisma, session.id, q, i)),
  );

  // Q1: audio answer với voice metrics
  const s6q1Text =
    'Tôi thường sử dụng Git flow với các branch feature, develop và main. Khi bắt đầu task, tôi tạo branch mới từ develop, code xong thì tạo pull request và yêu cầu code review từ teammate.';
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[0],
    answerText: s6q1Text,
    answerMode: 'audio',
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
      modelAnswer:
        'Git workflow hoàn chỉnh: feature branch → PR → code review → merge to develop → test → release to main. Nêu cả commit message convention và squash merge policy sẽ tốt hơn.',
      keyTakeaway:
        'Câu trả lời đúng và đủ. Thêm chi tiết về commit message convention sẽ thể hiện professionalism.',
      promptVersion: 'feedback-v1.3',
      segments: [
        segAt(s6q1Text, 'yêu cầu code review từ teammate', {
          highlightLevel: 'good',
          annotation:
            'Code review là best practice quan trọng — tốt khi đề cập.',
        }),
      ],
    },
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
  const s6q3Text =
    'Tôi chọn IT vì thích giải quyết vấn đề và thích xây dựng những thứ có thể dùng được. Khi nhìn thấy app mình làm được người khác dùng là cảm thấy rất có ý nghĩa.';
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[2],
    answerText: s6q3Text,
    feedbackGenerated: true,
    feedback: {
      overallScore: 70,
      modelAnswer:
        'Câu trả lời về động lực tốt khi kết hợp: passion thực sự + impact cụ thể bạn muốn tạo ra + liên kết với role đang ứng tuyển.',
      keyTakeaway:
        'Chân thực và dễ gần. Cần kết nối cụ thể hơn với vị trí Mobile Developer đang apply.',
      promptVersion: 'feedback-v1.3',
      segments: [
        segAt(s6q3Text, 'thích giải quyết vấn đề', {
          highlightLevel: 'warning',
          annotation:
            '"Thích giải quyết vấn đề" là cliché phổ biến. Hãy nêu loại vấn đề cụ thể bạn thích.',
          suggestion:
            'Thêm ví dụ: "tôi thích giải quyết bài toán UI performance — tối ưu render time từ 3s xuống 0.8s trong dự án X"',
        }),
      ],
    },
  });

  console.log(
    'sessions: S6 seeded (completed·VN·mixed·audio+skip+followup)',
  );
  return session.id;
}

// ═══════════════════════════════════════════════════════════════════════════
// S7 — completed · Western · mixed · fallback feedback · low score 42
// ═══════════════════════════════════════════════════════════════════════════
async function seedS7(prisma: PrismaClient, userId: string): Promise<string> {
  if (await alreadySeeded(prisma, userId, 'SEED-S7')) return '';

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
      openingTranscript: '[SEED-S7]',
      overallScore: 42,
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  const qs = await pickQuestions(prisma, 'mixed', 'Western', 3, 3);
  const sqIds = await Promise.all(
    qs.map((q, i) => createSQ(prisma, session.id, q, i)),
  );

  // All 3 answers: short, vague, low scores, fallback feedback

  const s7q1Text =
    "I don't really know, I just like computers. I'm good at figuring things out.";
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[0],
    answerText: s7q1Text,
    feedbackGenerated: true,
    feedback: {
      overallScore: 35,
      isFallback: true,
      modelAnswer:
        'A strong answer explains: what drew you to this specific role, a concrete past experience, and what impact you want to create. Use the STAR framework for any experience-based question.',
      keyTakeaway:
        'Answer is too vague. No specific examples or connection to the role.',
      promptVersion: 'feedback-v1.3-fallback',
      segments: [
        segAt(s7q1Text, "I don't really know", {
          highlightLevel: 'critical',
          annotation:
            'Starting with uncertainty signals lack of preparation. Always have a clear answer for motivation questions.',
          suggestion:
            'Replace with a specific story: "I got into DevOps after spending 3 days debugging a production outage — I realized I wanted to build the systems that prevent those."',
        }),
      ],
    },
  });

  const s7q2Text =
    "I usually just Google it or ask someone. I'm not sure what else to say.";
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[1],
    answerText: s7q2Text,
    feedbackGenerated: true,
    feedback: {
      overallScore: 40,
      isFallback: true,
      modelAnswer:
        'Describe a structured debug process: reproduce → isolate → hypothesize → verify → fix → prevent. Mention specific tools you use (logs, debugger, git bisect).',
      keyTakeaway:
        'Googling and asking are valid tactics but not a complete answer. Show your systematic thinking.',
      promptVersion: 'feedback-v1.3-fallback',
      segments: [
        segAt(s7q2Text, 'I usually just Google it', {
          highlightLevel: 'warning',
          annotation:
            'Valid but incomplete. Everyone Googles — what makes you different is your systematic approach.',
        }),
        segAt(s7q2Text, "I'm not sure what else to say", {
          highlightLevel: 'critical',
          annotation:
            'Never trail off in an interview. If unsure, say: "Let me think through this systematically..." and walk through the steps.',
        }),
      ],
    },
  });

  const s7q3Text =
    'I worked on a group project at school but it was just a simple website. Nothing special.';
  await createAnswerWithFeedback(prisma, {
    sessionId: session.id,
    questionId: sqIds[2],
    answerText: s7q3Text,
    feedbackGenerated: true,
    feedback: {
      overallScore: 38,
      isFallback: true,
      modelAnswer:
        'Use STAR: Situation (context of the project), Task (your specific role), Action (concrete steps you took), Result (measurable outcome). Even simple projects become compelling with structure.',
      keyTakeaway:
        '"Nothing special" is a missed opportunity. Every project has a story — find the interesting decision or challenge within it.',
      promptVersion: 'feedback-v1.3-fallback',
      segments: [
        segAt(s7q3Text, 'Nothing special', {
          highlightLevel: 'critical',
          annotation:
            'Self-deprecating language hurts your candidacy. Reframe: what was the most interesting technical challenge, even in a simple project?',
          suggestion:
            'Replace with: "We built a simple e-commerce site — the most interesting challenge was designing the database schema for product variants."',
        }),
      ],
    },
  });

  console.log(
    'sessions: S7 seeded (completed·Western·mixed·fallback·score=42)',
  );
  return session.id;
}

// ═══════════════════════════════════════════════════════════════════════════
// Orchestrator
// ═══════════════════════════════════════════════════════════════════════════
export async function seedSessions(
  prisma: PrismaClient,
  userId: string,
): Promise<Record<string, string>> {
  return {
    s1: await seedS1(prisma, userId),
    s2: await seedS2(prisma, userId),
    s3: await seedS3(prisma, userId),
    s4: await seedS4(prisma, userId),
    s5: await seedS5(prisma, userId),
    s6: await seedS6(prisma, userId),
    s7: await seedS7(prisma, userId),
  };
}
