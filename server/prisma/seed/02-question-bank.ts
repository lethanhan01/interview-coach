import type { Prisma, PrismaClient, QuestionSessionType } from '@prisma/client';

type RawQuestion = {
  content: string;
  sessionType: QuestionSessionType;
  difficulty: number;
  contextPackId: 'VN' | 'Western';
  subcategory: string;
  competencyDomains: string[];
  applicableRoles: string[];
  applicableLevels: string[];
};

type LocalizedQuestion = Omit<RawQuestion, 'content'> & {
  enContent: string;
  viContent: string;
};

type SeedQuestion = {
  content: string;
  sessionType: QuestionSessionType;
  difficulty: number;
  contextPackId: 'VN' | 'Western';
  competencyDomains: string[];
  estimatedTimeMin: number;
  translations: Prisma.InputJsonObject;
  contentJson: Prisma.InputJsonObject;
};

const QUESTION_PAIR_SIZE = 15;

const QUESTIONS: RawQuestion[] = [
  // ── Pair A: hr × VN (15 câu) ────────────────────────────────────────────
  {
    content: 'Hãy giới thiệu về bản thân bạn trong 2 phút.',
    sessionType: 'hr',
    difficulty: 1,
    contextPackId: 'VN',
    subcategory: 'self-introduction',
    competencyDomains: ['D4'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid', 'senior'],
  },
  {
    content: 'Tại sao bạn lựa chọn nghề IT/lập trình?',
    sessionType: 'hr',
    difficulty: 1,
    contextPackId: 'VN',
    subcategory: 'motivation',
    competencyDomains: ['D4'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content: 'Bạn biết gì về công ty và vị trí bạn đang ứng tuyển?',
    sessionType: 'hr',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'culture-fit',
    competencyDomains: ['D5'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid', 'senior'],
  },
  {
    content: 'Bạn thích làm việc độc lập hay theo nhóm? Tại sao?',
    sessionType: 'hr',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'teamwork-preference',
    competencyDomains: ['D3'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content: 'Môi trường làm việc lý tưởng của bạn trông như thế nào?',
    sessionType: 'hr',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'culture-fit',
    competencyDomains: ['D5'],
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
    competencyDomains: ['D1'],
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
    competencyDomains: ['D1'],
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
    competencyDomains: ['D3'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid', 'senior'],
  },
  {
    content: 'Điều gì thúc đẩy bạn làm việc hiệu quả nhất? Cho ví dụ cụ thể.',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'motivation',
    competencyDomains: ['D4'],
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
    competencyDomains: ['D6'],
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
    competencyDomains: ['D2', 'D6'],
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
    competencyDomains: ['D2'],
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
    competencyDomains: ['D2'],
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
    competencyDomains: ['D4', 'D1'],
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
    competencyDomains: ['D6'],
    applicableRoles: ['all'],
    applicableLevels: ['mid', 'senior'],
  },
  // ── Pair B: hr × Western (15 câu) ───────────────────────────────────────
  {
    content: 'Tell me about yourself.',
    sessionType: 'hr',
    difficulty: 1,
    contextPackId: 'Western',
    subcategory: 'self-introduction',
    competencyDomains: ['D4'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid', 'senior'],
  },
  {
    content: 'Why did you choose a career in software engineering?',
    sessionType: 'hr',
    difficulty: 1,
    contextPackId: 'Western',
    subcategory: 'motivation',
    competencyDomains: ['D4'],
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
    competencyDomains: ['D5', 'D4'],
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
    competencyDomains: ['D3'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content: 'Describe your ideal work environment.',
    sessionType: 'hr',
    difficulty: 2,
    contextPackId: 'Western',
    subcategory: 'culture-fit',
    competencyDomains: ['D5'],
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
    competencyDomains: ['D1'],
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
    competencyDomains: ['D1', 'D2'],
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
    competencyDomains: ['D3'],
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
    competencyDomains: ['D4'],
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
    competencyDomains: ['D6'],
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
    competencyDomains: ['D2', 'D6'],
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
    competencyDomains: ['D2'],
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
    competencyDomains: ['D2'],
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
    competencyDomains: ['D4', 'D1'],
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
    competencyDomains: ['D6'],
    applicableRoles: ['all'],
    applicableLevels: ['mid', 'senior'],
  },
  // ── Pair C: technical × VN (15 câu) ─────────────────────────────────────
  {
    content: 'REST là gì và tại sao nó phổ biến? Nêu ít nhất 3 đặc điểm chính.',
    sessionType: 'technical',
    difficulty: 1,
    contextPackId: 'VN',
    subcategory: 'web-fundamentals',
    competencyDomains: ['TD1'],
    applicableRoles: ['backend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content: 'Sự khác biệt giữa SQL và NoSQL là gì? Khi nào bạn chọn cái nào?',
    sessionType: 'technical',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'databases',
    competencyDomains: ['TD1', 'TD2'],
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
    competencyDomains: ['TD2', 'TD1'],
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
    competencyDomains: ['TD1', 'TD2'],
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
    competencyDomains: ['TD5'],
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
    competencyDomains: ['TD4', 'TD1'],
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
    competencyDomains: ['TD2', 'TD5'],
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
    competencyDomains: ['TD2'],
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
    competencyDomains: ['TD4'],
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
    competencyDomains: ['TD4'],
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
    competencyDomains: ['TD5'],
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
    competencyDomains: ['TD3'],
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
    competencyDomains: ['TD4', 'TD2'],
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
    competencyDomains: ['TD5'],
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
    competencyDomains: ['TD3', 'TD2'],
    applicableRoles: ['backend', 'fullstack'],
    applicableLevels: ['mid', 'senior'],
  },
  // ── Pair D: technical × Western (15 câu) ────────────────────────────────
  {
    content:
      'What is REST and why is it widely used? Name at least 3 key characteristics.',
    sessionType: 'technical',
    difficulty: 1,
    contextPackId: 'Western',
    subcategory: 'web-fundamentals',
    competencyDomains: ['TD1'],
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
    competencyDomains: ['TD1', 'TD2'],
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
    competencyDomains: ['TD2'],
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
    competencyDomains: ['TD1', 'TD2'],
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
    competencyDomains: ['TD5'],
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
    competencyDomains: ['TD4', 'TD1'],
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
    competencyDomains: ['TD2', 'TD5'],
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
    competencyDomains: ['TD2'],
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
    competencyDomains: ['TD4'],
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
    competencyDomains: ['TD4'],
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
    competencyDomains: ['TD5'],
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
    competencyDomains: ['TD3'],
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
    competencyDomains: ['TD4', 'TD2'],
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
    competencyDomains: ['TD5'],
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
    competencyDomains: ['TD3', 'TD2'],
    applicableRoles: ['backend', 'fullstack'],
    applicableLevels: ['mid', 'senior'],
  },
  // ── Pair E: mixed × VN (15 câu) ─────────────────────────────────────────
  {
    content: 'Hãy giới thiệu bản thân và một project kỹ thuật bạn tự hào nhất.',
    sessionType: 'hr',
    difficulty: 1,
    contextPackId: 'VN',
    subcategory: 'self-introduction',
    competencyDomains: ['D4'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content: 'Bạn biết gì về Git? Mô tả quy trình từ code đến push lên remote.',
    sessionType: 'technical',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'version-control',
    competencyDomains: ['TD1'],
    applicableRoles: ['all'],
    applicableLevels: ['junior'],
  },
  {
    content: 'Gặp vấn đề không biết giải quyết trong code, bạn làm gì?',
    sessionType: 'hr',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'problem-solving',
    competencyDomains: ['D2'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content: 'Bạn nghĩ gì về việc làm thêm giờ khi project cần?',
    sessionType: 'hr',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'culture-fit',
    competencyDomains: ['D5'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid', 'senior'],
  },
  {
    content:
      'Bạn tự đánh giá kỹ năng giao tiếp của mình thế nào? Cho ví dụ cụ thể.',
    sessionType: 'hr',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'communication',
    competencyDomains: ['D1'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content:
      'Điều gì khiến bạn muốn theo đuổi sự nghiệp trong ngành IT và vì sao lại chọn vai trò này?',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'motivation',
    competencyDomains: ['D4'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid', 'senior'],
  },
  {
    content:
      'Bạn đã xây dựng project nào ấn tượng nhất? Mô tả các quyết định kỹ thuật quan trọng.',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'technical-experience',
    competencyDomains: ['TD2'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content:
      'Kể về một lần bạn phải học công nghệ mới trong thời gian ngắn. Cách tiếp cận và kết quả?',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'learning-agility',
    competencyDomains: ['D2', 'D6'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content:
      'Bạn hiểu CI/CD là gì? Tại sao nó quan trọng và bạn đã dùng nó chưa?',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'devops-awareness',
    competencyDomains: ['TD3'],
    applicableRoles: ['backend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content:
      'Bạn làm gì để giữ code sạch và dễ bảo trì khi làm việc theo nhóm?',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'code-quality',
    competencyDomains: ['TD4'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid', 'senior'],
  },
  {
    content:
      'Mô tả trải nghiệm làm việc nhóm kỹ thuật của bạn. Bạn thường đóng vai trò gì?',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'teamwork',
    competencyDomains: ['D3'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid', 'senior'],
  },
  {
    content:
      'So với yêu cầu của vị trí này, bạn thấy mình đang thiếu kỹ năng gì? Kế hoạch bù đắp của bạn là gì?',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'self-awareness',
    competencyDomains: ['D6'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content:
      'Nếu phát hiện đồng nghiệp mắc lỗi nghiêm trọng gần deadline release, bạn xử lý thế nào?',
    sessionType: 'hr',
    difficulty: 4,
    contextPackId: 'VN',
    subcategory: 'integrity',
    competencyDomains: ['D4', 'D2'],
    applicableRoles: ['all'],
    applicableLevels: ['mid', 'senior'],
  },
  {
    content:
      'Design một REST API đơn giản cho hệ thống quản lý task. Nêu endpoints chính, HTTP methods, và data model.',
    sessionType: 'technical',
    difficulty: 4,
    contextPackId: 'VN',
    subcategory: 'api-design',
    competencyDomains: ['TD2', 'TD3'],
    applicableRoles: ['backend', 'fullstack'],
    applicableLevels: ['mid', 'senior'],
  },
  {
    content:
      'Kể về một project nhóm thất bại hoặc gặp khó khăn lớn. Bạn đóng góp gì, lỗi ở đâu, bài học bạn rút ra?',
    sessionType: 'hr',
    difficulty: 5,
    contextPackId: 'VN',
    subcategory: 'reflection',
    competencyDomains: ['D3', 'D4', 'D6'],
    applicableRoles: ['all'],
    applicableLevels: ['mid', 'senior'],
  },
  // ── Pair F: mixed × Western (15 câu) ────────────────────────────────────
  {
    content:
      'Introduce yourself and walk me through your most impressive technical project.',
    sessionType: 'hr',
    difficulty: 1,
    contextPackId: 'Western',
    subcategory: 'self-introduction',
    competencyDomains: ['D4'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content:
      'Tell me about your experience with Git. Describe your workflow from coding to pushing to remote.',
    sessionType: 'technical',
    difficulty: 2,
    contextPackId: 'Western',
    subcategory: 'version-control',
    competencyDomains: ['TD1'],
    applicableRoles: ['all'],
    applicableLevels: ['junior'],
  },
  {
    content:
      'When you hit a blocker on a coding problem you cannot solve, what do you do?',
    sessionType: 'hr',
    difficulty: 2,
    contextPackId: 'Western',
    subcategory: 'problem-solving',
    competencyDomains: ['D2'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content:
      'How do you feel about working overtime when a project demands it?',
    sessionType: 'hr',
    difficulty: 2,
    contextPackId: 'Western',
    subcategory: 'culture-fit',
    competencyDomains: ['D5'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid', 'senior'],
  },
  {
    content:
      'How would you rate your communication skills and why? Give a specific example.',
    sessionType: 'hr',
    difficulty: 2,
    contextPackId: 'Western',
    subcategory: 'communication',
    competencyDomains: ['D1', 'D4'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content:
      'What drew you to a career in software engineering, and why this specific role?',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'Western',
    subcategory: 'motivation',
    competencyDomains: ['D4'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid', 'senior'],
  },
  {
    content:
      "What's the most impressive project you've built? Describe the key technical decisions you made.",
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'Western',
    subcategory: 'technical-experience',
    competencyDomains: ['TD2'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content:
      'Tell me about a time you had to learn a new technology quickly. How did you approach it and what was the result?',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'Western',
    subcategory: 'learning-agility',
    competencyDomains: ['D2', 'D6'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content:
      'What do you know about CI/CD? Why is it important and have you used it in your projects?',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'Western',
    subcategory: 'devops-awareness',
    competencyDomains: ['TD3'],
    applicableRoles: ['backend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content:
      'What do you do to keep code clean and maintainable when working on a team?',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'Western',
    subcategory: 'code-quality',
    competencyDomains: ['TD4'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid', 'senior'],
  },
  {
    content:
      'Describe your experience working in technical teams. What role do you typically play?',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'Western',
    subcategory: 'teamwork',
    competencyDomains: ['D3'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid', 'senior'],
  },
  {
    content:
      'Compared to the requirements of this role, what skills do you think you are lacking? What is your plan to address the gaps?',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'Western',
    subcategory: 'self-awareness',
    competencyDomains: ['D6'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    content:
      'If you discovered a teammate made a serious mistake close to a release deadline, how would you handle it?',
    sessionType: 'hr',
    difficulty: 4,
    contextPackId: 'Western',
    subcategory: 'integrity',
    competencyDomains: ['D4', 'D2'],
    applicableRoles: ['all'],
    applicableLevels: ['mid', 'senior'],
  },
  {
    content:
      'Design a simple REST API for a task management system. Describe the main endpoints, HTTP methods, and data model.',
    sessionType: 'technical',
    difficulty: 4,
    contextPackId: 'Western',
    subcategory: 'api-design',
    competencyDomains: ['TD2', 'TD3'],
    applicableRoles: ['backend', 'fullstack'],
    applicableLevels: ['mid', 'senior'],
  },
  {
    content:
      'Tell me about a team project that failed or faced major challenges. What was your contribution, where did things go wrong, and what did you learn?',
    sessionType: 'hr',
    difficulty: 5,
    contextPackId: 'Western',
    subcategory: 'reflection',
    competencyDomains: ['D3', 'D6'],
    applicableRoles: ['all'],
    applicableLevels: ['mid', 'senior'],
  },
];

const FRONTEND_QUESTIONS: LocalizedQuestion[] = [
  {
    enContent:
      'Explain how React useState updates are scheduled and why reading state immediately after setState can be misleading.',
    viContent:
      'Giải thích cách React useState lên lịch cập nhật và vì sao đọc state ngay sau setState có thể gây hiểu nhầm.',
    sessionType: 'technical',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'react-hooks',
    competencyDomains: ['TD1'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent:
      'What problems does useEffect solve, and what common mistakes cause unnecessary re-renders or stale data?',
    viContent:
      'useEffect giải quyết vấn đề gì, và những lỗi phổ biến nào gây re-render không cần thiết hoặc dữ liệu cũ?',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'react-hooks',
    competencyDomains: ['TD4', 'TD5'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent:
      'Describe when you would use useMemo or useCallback in a React component. Give one case where using them is not worth it.',
    viContent:
      'Mô tả khi nào bạn dùng useMemo hoặc useCallback trong React component. Nêu một trường hợp không đáng dùng chúng.',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'react-performance',
    competencyDomains: ['TD5', 'TD2'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['mid', 'senior'],
  },
  {
    enContent:
      'How would you structure state between local component state, URL state, and server state in a dashboard page?',
    viContent:
      'Bạn sẽ tổ chức state giữa local component state, URL state và server state như thế nào trong một trang dashboard?',
    sessionType: 'technical',
    difficulty: 4,
    contextPackId: 'VN',
    subcategory: 'frontend-architecture',
    competencyDomains: ['TD3'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['mid', 'senior'],
  },
  {
    enContent:
      'Explain the difference between controlled and uncontrolled form inputs in React. When would you choose each?',
    viContent:
      'Giải thích sự khác nhau giữa controlled và uncontrolled form input trong React. Khi nào bạn chọn từng cách?',
    sessionType: 'technical',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'forms',
    competencyDomains: ['TD1', 'TD2'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent:
      'What is CSS specificity, and how do you debug a style rule that is not being applied?',
    viContent:
      'CSS specificity là gì, và bạn debug một style rule không được áp dụng như thế nào?',
    sessionType: 'technical',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'css',
    competencyDomains: ['TD5', 'TD1'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent:
      'Compare Flexbox and CSS Grid. Give an example layout where each one is the better choice.',
    viContent:
      'So sánh Flexbox và CSS Grid. Cho ví dụ layout mà mỗi công cụ là lựa chọn tốt hơn.',
    sessionType: 'technical',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'css-layout',
    competencyDomains: ['TD1', 'TD2'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent:
      'How do you make a web page responsive without relying on fixed pixel widths everywhere?',
    viContent:
      'Bạn làm một trang web responsive như thế nào mà không phụ thuộc vào fixed pixel width ở mọi nơi?',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'responsive-design',
    competencyDomains: ['TD4'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent:
      'Explain event bubbling and event delegation in the browser. How can delegation improve performance?',
    viContent:
      'Giải thích event bubbling và event delegation trong browser. Delegation có thể cải thiện performance như thế nào?',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'browser-events',
    competencyDomains: ['TD1', 'TD5'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent:
      'What happens in the JavaScript event loop when a Promise resolves and a setTimeout callback is also waiting?',
    viContent:
      'Điều gì xảy ra trong JavaScript event loop khi một Promise resolve và một callback setTimeout cũng đang chờ?',
    sessionType: 'technical',
    difficulty: 4,
    contextPackId: 'VN',
    subcategory: 'javascript-runtime',
    competencyDomains: ['TD1'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['mid', 'senior'],
  },
  {
    enContent:
      'How would you reduce initial load time for a React application used by candidates on slower mobile networks?',
    viContent:
      'Bạn sẽ giảm thời gian tải ban đầu cho một ứng dụng React mà ứng viên dùng trên mạng di động chậm như thế nào?',
    sessionType: 'technical',
    difficulty: 4,
    contextPackId: 'VN',
    subcategory: 'frontend-performance',
    competencyDomains: ['TD5'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['mid', 'senior'],
  },
  {
    enContent:
      'What accessibility checks do you perform before shipping a form-heavy page?',
    viContent:
      'Bạn kiểm tra accessibility gì trước khi release một trang có nhiều form?',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'accessibility',
    competencyDomains: ['TD4'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid', 'senior'],
  },
  {
    enContent:
      'Design a reusable modal component. What API, focus behavior, and cleanup details would you consider?',
    viContent:
      'Thiết kế một modal component tái sử dụng. Bạn cân nhắc API, focus behavior và cleanup như thế nào?',
    sessionType: 'technical',
    difficulty: 4,
    contextPackId: 'VN',
    subcategory: 'component-design',
    competencyDomains: ['TD3', 'TD2'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['mid', 'senior'],
  },
  {
    enContent:
      'How do you test a React component that fetches data and has loading, error, and success states?',
    viContent:
      'Bạn test một React component fetch data và có loading, error, success states như thế nào?',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'frontend-testing',
    competencyDomains: ['TD4'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent:
      'Walk through how you would debug a production-only hydration mismatch in a Next.js page.',
    viContent:
      'Trình bày cách bạn debug một hydration mismatch chỉ xuất hiện trên production trong Next.js.',
    sessionType: 'technical',
    difficulty: 5,
    contextPackId: 'VN',
    subcategory: 'nextjs-debugging',
    competencyDomains: ['TD5'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['mid', 'senior'],
  },
  {
    enContent:
      'Explain how React useState updates are scheduled and why reading state immediately after setState can be misleading.',
    viContent:
      'Giải thích cách React useState lên lịch cập nhật và vì sao đọc state ngay sau setState có thể gây hiểu nhầm.',
    sessionType: 'technical',
    difficulty: 2,
    contextPackId: 'Western',
    subcategory: 'react-hooks',
    competencyDomains: ['TD1'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent:
      'What problems does useEffect solve, and what common mistakes cause unnecessary re-renders or stale data?',
    viContent:
      'useEffect giải quyết vấn đề gì, và những lỗi phổ biến nào gây re-render không cần thiết hoặc dữ liệu cũ?',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'Western',
    subcategory: 'react-hooks',
    competencyDomains: ['TD4', 'TD5'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent:
      'Describe when you would use useMemo or useCallback in a React component. Give one case where using them is not worth it.',
    viContent:
      'Mô tả khi nào bạn dùng useMemo hoặc useCallback trong React component. Nêu một trường hợp không đáng dùng chúng.',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'Western',
    subcategory: 'react-performance',
    competencyDomains: ['TD5', 'TD2'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['mid', 'senior'],
  },
  {
    enContent:
      'How would you structure state between local component state, URL state, and server state in a dashboard page?',
    viContent:
      'Bạn sẽ tổ chức state giữa local component state, URL state và server state như thế nào trong một trang dashboard?',
    sessionType: 'technical',
    difficulty: 4,
    contextPackId: 'Western',
    subcategory: 'frontend-architecture',
    competencyDomains: ['TD3'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['mid', 'senior'],
  },
  {
    enContent:
      'Explain the difference between controlled and uncontrolled form inputs in React. When would you choose each?',
    viContent:
      'Giải thích sự khác nhau giữa controlled và uncontrolled form input trong React. Khi nào bạn chọn từng cách?',
    sessionType: 'technical',
    difficulty: 2,
    contextPackId: 'Western',
    subcategory: 'forms',
    competencyDomains: ['TD1', 'TD2'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent:
      'What is CSS specificity, and how do you debug a style rule that is not being applied?',
    viContent:
      'CSS specificity là gì, và bạn debug một style rule không được áp dụng như thế nào?',
    sessionType: 'technical',
    difficulty: 2,
    contextPackId: 'Western',
    subcategory: 'css',
    competencyDomains: ['TD5', 'TD1'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent:
      'Compare Flexbox and CSS Grid. Give an example layout where each one is the better choice.',
    viContent:
      'So sánh Flexbox và CSS Grid. Cho ví dụ layout mà mỗi công cụ là lựa chọn tốt hơn.',
    sessionType: 'technical',
    difficulty: 2,
    contextPackId: 'Western',
    subcategory: 'css-layout',
    competencyDomains: ['TD1', 'TD2'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent:
      'How do you make a web page responsive without relying on fixed pixel widths everywhere?',
    viContent:
      'Bạn làm một trang web responsive như thế nào mà không phụ thuộc vào fixed pixel width ở mọi nơi?',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'Western',
    subcategory: 'responsive-design',
    competencyDomains: ['TD4'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent:
      'Explain event bubbling and event delegation in the browser. How can delegation improve performance?',
    viContent:
      'Giải thích event bubbling và event delegation trong browser. Delegation có thể cải thiện performance như thế nào?',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'Western',
    subcategory: 'browser-events',
    competencyDomains: ['TD1', 'TD5'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent:
      'What happens in the JavaScript event loop when a Promise resolves and a setTimeout callback is also waiting?',
    viContent:
      'Điều gì xảy ra trong JavaScript event loop khi một Promise resolve và một callback setTimeout cũng đang chờ?',
    sessionType: 'technical',
    difficulty: 4,
    contextPackId: 'Western',
    subcategory: 'javascript-runtime',
    competencyDomains: ['TD1'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['mid', 'senior'],
  },
  {
    enContent:
      'How would you reduce initial load time for a React application used by candidates on slower mobile networks?',
    viContent:
      'Bạn sẽ giảm thời gian tải ban đầu cho một ứng dụng React mà ứng viên dùng trên mạng di động chậm như thế nào?',
    sessionType: 'technical',
    difficulty: 4,
    contextPackId: 'Western',
    subcategory: 'frontend-performance',
    competencyDomains: ['TD5'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['mid', 'senior'],
  },
  {
    enContent:
      'What accessibility checks do you perform before shipping a form-heavy page?',
    viContent:
      'Bạn kiểm tra accessibility gì trước khi release một trang có nhiều form?',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'Western',
    subcategory: 'accessibility',
    competencyDomains: ['TD4'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid', 'senior'],
  },
  {
    enContent:
      'Design a reusable modal component. What API, focus behavior, and cleanup details would you consider?',
    viContent:
      'Thiết kế một modal component tái sử dụng. Bạn cân nhắc API, focus behavior và cleanup như thế nào?',
    sessionType: 'technical',
    difficulty: 4,
    contextPackId: 'Western',
    subcategory: 'component-design',
    competencyDomains: ['TD3', 'TD2'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['mid', 'senior'],
  },
  {
    enContent:
      'How do you test a React component that fetches data and has loading, error, and success states?',
    viContent:
      'Bạn test một React component fetch data và có loading, error, success states như thế nào?',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'Western',
    subcategory: 'frontend-testing',
    competencyDomains: ['TD4'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent:
      'Walk through how you would debug a production-only hydration mismatch in a Next.js page.',
    viContent:
      'Trình bày cách bạn debug một hydration mismatch chỉ xuất hiện trên production trong Next.js.',
    sessionType: 'technical',
    difficulty: 5,
    contextPackId: 'Western',
    subcategory: 'nextjs-debugging',
    competencyDomains: ['TD5'],
    applicableRoles: ['frontend', 'fullstack'],
    applicableLevels: ['mid', 'senior'],
  },
  // ── HR × VN extended (15 câu) ─────────────────────────────────────────────
  {
    enContent: 'Why did you choose to apply to this company specifically, and what do you know about our products or culture?',
    viContent: 'Tại sao bạn chọn ứng tuyển vào công ty này, và bạn biết gì về sản phẩm hoặc văn hóa của chúng tôi?',
    sessionType: 'hr',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'why-this-company',
    competencyDomains: ['D4', 'D5'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'Where do you see yourself professionally in three to five years, and how does this role fit into that path?',
    viContent: 'Bạn thấy mình ở đâu về mặt nghề nghiệp trong 3-5 năm tới, và vị trí này phù hợp với lộ trình đó như thế nào?',
    sessionType: 'hr',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'career-vision',
    competencyDomains: ['D4'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'Tell me about a time you failed at something. What did you do next and what did you learn?',
    viContent: 'Kể về một lần bạn thất bại trong công việc hoặc học tập. Bạn đã làm gì tiếp theo và rút ra bài học gì?',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'learning-failure',
    competencyDomains: ['D3', 'D6'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'How do you approach working in a team where members are remote or in different time zones?',
    viContent: 'Bạn tiếp cận việc làm trong nhóm mà các thành viên làm việc từ xa hoặc khác múi giờ như thế nào?',
    sessionType: 'hr',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'remote-work',
    competencyDomains: ['D5', 'D2'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'Describe a situation where you had to learn something entirely new to solve a problem. How did you approach it?',
    viContent: 'Mô tả tình huống bạn phải học một điều hoàn toàn mới để giải quyết vấn đề. Bạn tiếp cận như thế nào?',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'self-learning',
    competencyDomains: ['D4', 'D2'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'How do you prioritize when you have multiple tasks with similar urgency? Walk me through your method.',
    viContent: 'Bạn ưu tiên như thế nào khi có nhiều nhiệm vụ có mức độ khẩn cấp tương đương? Hãy mô tả phương pháp của bạn.',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'deadline-management',
    competencyDomains: ['D5', 'D2'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'How do you typically give feedback to a teammate whose code or work you think can be improved?',
    viContent: 'Bạn thường cho phản hồi về code hoặc công việc của đồng đội cần cải thiện như thế nào?',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'feedback-giving',
    competencyDomains: ['D3', 'D1'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'Describe a time when you had to work with incomplete or ambiguous requirements. What did you do?',
    viContent: 'Mô tả một lần bạn phải làm việc với yêu cầu không đầy đủ hoặc mơ hồ. Bạn đã xử lý thế nào?',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'unclear-requirements',
    competencyDomains: ['D5', 'D2'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'How do you keep your technical skills current? What resources or habits do you use to stay up to date?',
    viContent: 'Bạn giữ kỹ năng kỹ thuật của mình được cập nhật như thế nào? Bạn dùng tài nguyên hay thói quen gì?',
    sessionType: 'hr',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'self-study',
    competencyDomains: ['D4'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'What would you contribute to the team beyond your assigned technical tasks?',
    viContent: 'Bạn có thể đóng góp gì cho nhóm ngoài các nhiệm vụ kỹ thuật được giao?',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'team-contribution',
    competencyDomains: ['D6', 'D3'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'Tell me about a time you received critical feedback. How did you react and what did you change?',
    viContent: 'Kể về một lần bạn nhận được phản hồi tiêu cực. Bạn phản ứng như thế nào và bạn đã thay đổi gì?',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'negative-feedback',
    competencyDomains: ['D3', 'D1'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'As a fresher, what unique perspective or energy do you bring to a team of more experienced engineers?',
    viContent: 'Là fresher, bạn mang lại góc nhìn hay năng lượng gì độc đáo cho nhóm có nhiều kỹ sư kinh nghiệm hơn?',
    sessionType: 'hr',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'fresh-perspective',
    competencyDomains: ['D4', 'D3'],
    applicableRoles: ['all'],
    applicableLevels: ['junior'],
  },
  {
    enContent: 'Describe the most technically challenging problem you have faced. How did you approach and resolve it?',
    viContent: 'Mô tả vấn đề kỹ thuật thách thức nhất bạn từng đối mặt. Bạn tiếp cận và giải quyết như thế nào?',
    sessionType: 'hr',
    difficulty: 4,
    contextPackId: 'VN',
    subcategory: 'technical-challenge',
    competencyDomains: ['D3', 'D2'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'How do you handle situations where your workload is consistently more than you can finish in working hours?',
    viContent: 'Bạn xử lý như thế nào khi khối lượng công việc thường xuyên vượt quá khả năng hoàn thành trong giờ làm?',
    sessionType: 'hr',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'work-life-balance',
    competencyDomains: ['D5'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'What is your approach when you disagree with a decision made by your team lead or manager?',
    viContent: 'Cách tiếp cận của bạn khi không đồng ý với quyết định của trưởng nhóm hoặc quản lý là gì?',
    sessionType: 'hr',
    difficulty: 4,
    contextPackId: 'VN',
    subcategory: 'upward-disagreement',
    competencyDomains: ['D6', 'D2'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  // ── Technical × VN extended (10 câu) ──────────────────────────────────────
  {
    enContent: 'What is the difference between GET, POST, PUT, and DELETE HTTP methods, and when do you use each?',
    viContent: 'Sự khác biệt giữa các HTTP method GET, POST, PUT và DELETE là gì, và khi nào bạn dùng từng loại?',
    sessionType: 'technical',
    difficulty: 1,
    contextPackId: 'VN',
    subcategory: 'http-basics',
    competencyDomains: ['TD1', 'TD2'],
    applicableRoles: ['backend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'What makes an API RESTful? Name three constraints that distinguish REST from a plain HTTP API.',
    viContent: 'Điều gì làm cho một API là RESTful? Nêu ba ràng buộc phân biệt REST với một HTTP API thông thường.',
    sessionType: 'technical',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'rest-api',
    competencyDomains: ['TD1', 'TD2'],
    applicableRoles: ['backend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'When would you choose a NoSQL database over a relational database? Give a concrete example.',
    viContent: 'Khi nào bạn chọn NoSQL thay vì cơ sở dữ liệu quan hệ? Cho một ví dụ cụ thể.',
    sessionType: 'technical',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'database-types',
    competencyDomains: ['TD2'],
    applicableRoles: ['backend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'Explain what a database index does and describe a case where adding an index would hurt performance.',
    viContent: 'Giải thích index trong cơ sở dữ liệu làm gì và mô tả một trường hợp thêm index lại làm giảm hiệu năng.',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'database-indexing',
    competencyDomains: ['TD2', 'TD1'],
    applicableRoles: ['backend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'Describe a Git branching strategy you have used. How did it help coordinate work in your team?',
    viContent: 'Mô tả một chiến lược branching Git bạn đã dùng. Nó giúp phối hợp công việc trong nhóm như thế nào?',
    sessionType: 'technical',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'git-workflow',
    competencyDomains: ['TD1'],
    applicableRoles: ['all'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'Explain the difference between callbacks, Promises, and async/await. Why did async/await become preferred?',
    viContent: 'Giải thích sự khác biệt giữa callback, Promise và async/await. Tại sao async/await trở nên được ưa chuộng hơn?',
    sessionType: 'technical',
    difficulty: 2,
    contextPackId: 'VN',
    subcategory: 'async-programming',
    competencyDomains: ['TD1'],
    applicableRoles: ['backend', 'frontend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'Compare JWT-based authentication with session-based authentication. What are the trade-offs of each?',
    viContent: 'So sánh xác thực dựa trên JWT với xác thực dựa trên session. Đánh đổi của mỗi cách là gì?',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'authentication',
    competencyDomains: ['TD2'],
    applicableRoles: ['backend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'What is Docker, and how does containerizing an application help during development and deployment?',
    viContent: 'Docker là gì, và container hóa ứng dụng giúp ích như thế nào trong quá trình phát triển và triển khai?',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'containerization',
    competencyDomains: ['TD3', 'TD1'],
    applicableRoles: ['backend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'What is a CI/CD pipeline? Describe each stage and explain why it reduces risk when shipping code.',
    viContent: 'CI/CD pipeline là gì? Mô tả từng giai đoạn và giải thích vì sao nó giảm rủi ro khi deploy code.',
    sessionType: 'technical',
    difficulty: 3,
    contextPackId: 'VN',
    subcategory: 'ci-cd',
    competencyDomains: ['TD3', 'TD1'],
    applicableRoles: ['backend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
  {
    enContent: 'What is the N+1 query problem in ORMs? How would you detect and fix it in a real application?',
    viContent: 'Vấn đề N+1 query trong ORM là gì? Bạn sẽ phát hiện và sửa nó như thế nào trong ứng dụng thực tế?',
    sessionType: 'technical',
    difficulty: 4,
    contextPackId: 'VN',
    subcategory: 'query-optimization',
    competencyDomains: ['TD2', 'TD1'],
    applicableRoles: ['backend', 'fullstack'],
    applicableLevels: ['junior', 'mid'],
  },
];

function estimateTimeMin(difficulty: number): number {
  if (difficulty <= 2) return 3;
  if (difficulty === 3) return 5;
  return 7;
}

function toSeedQuestion(
  question: RawQuestion,
  enContent: string,
  viContent: string,
): SeedQuestion {
  return {
    content: enContent,
    sessionType: question.sessionType,
    difficulty: question.difficulty,
    contextPackId: question.contextPackId,
    competencyDomains: question.competencyDomains,
    estimatedTimeMin: estimateTimeMin(question.difficulty),
    translations: {
      en: enContent,
      vi: viContent,
    },
    contentJson: {
      source: 'seed',
      en: enContent,
      vi: viContent,
    },
  };
}

function enrichExistingQuestions(questions: RawQuestion[]): SeedQuestion[] {
  const result: SeedQuestion[] = [];

  for (
    let index = 0;
    index < questions.length;
    index += QUESTION_PAIR_SIZE * 2
  ) {
    const vnQuestions = questions.slice(index, index + QUESTION_PAIR_SIZE);
    const westernQuestions = questions.slice(
      index + QUESTION_PAIR_SIZE,
      index + QUESTION_PAIR_SIZE * 2,
    );

    for (let offset = 0; offset < QUESTION_PAIR_SIZE; offset += 1) {
      const vnQuestion = vnQuestions[offset];
      const westernQuestion = westernQuestions[offset];

      result.push(
        toSeedQuestion(vnQuestion, westernQuestion.content, vnQuestion.content),
      );
      result.push(
        toSeedQuestion(
          westernQuestion,
          westernQuestion.content,
          vnQuestion.content,
        ),
      );
    }
  }

  return result;
}

function enrichFrontendQuestions(
  questions: LocalizedQuestion[],
): SeedQuestion[] {
  return questions.map(({ enContent, viContent, ...question }) =>
    toSeedQuestion({ ...question, content: enContent }, enContent, viContent),
  );
}

const SEED_QUESTIONS = [
  ...enrichExistingQuestions(QUESTIONS),
  ...enrichFrontendQuestions(FRONTEND_QUESTIONS),
];

export async function seedQuestionBank(prisma: PrismaClient): Promise<void> {
  // Count only canonical seed rows (not kaggle rows) to avoid false skip
  const activeCount = await prisma.questionBank.count({
    where: { deletedAt: null, contentJson: { path: ['source'], equals: 'seed' } },
  });

  if (activeCount >= SEED_QUESTIONS.length) {
    console.log('question_bank: already seeded, skipping');
    return;
  }

  if (activeCount > 0) {
    await prisma.questionBank.updateMany({
      where: { deletedAt: null, contentJson: { path: ['source'], equals: 'seed' } },
      data: { deletedAt: new Date() },
    });
  }

  await prisma.questionBank.createMany({
    data: SEED_QUESTIONS,
    skipDuplicates: true,
  });

  console.log(`question_bank: seeded ${SEED_QUESTIONS.length} questions`);
}
