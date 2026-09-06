import type {
  ActionPlanItem,
  BinaryCriterionResult,
  Report,
  SkillBreakdownItem,
  TranscriptItem,
} from '@/lib/types'

export const mockUnifiedSkillsBreakdown: SkillBreakdownItem[] = [
  {
    skillCode: 'PROG',
    skillName: 'Phát triển Phần mềm (Software Development)',
    techContext: ['TypeScript', 'Node.js', 'PostgreSQL'],
    targetLevel: 4,
    demonstratedLevel: 4,
    score: 88,
    status: 'passed',
    strengths:
      'Hiểu sâu về cấu trúc dữ liệu, xử lý bất đồng bộ và Clean Architecture.',
    areasForImprovement:
      'Cần chú ý tối ưu hóa bộ nhớ và stream processing khi xử lý dữ liệu lớn.',
  },
  {
    skillCode: 'DBDS',
    skillName: 'Thiết kế Cơ sở Dữ liệu (Database Design)',
    techContext: ['PostgreSQL', 'Redis'],
    targetLevel: 4,
    demonstratedLevel: 3,
    score: 72,
    status: 'gap',
    strengths:
      'Thiết kế chuẩn hóa dữ liệu 3NF chặt chẽ, tối ưu truy vấn qua composite index.',
    areasForImprovement:
      'Chưa nắm vững kỹ thuật sharding và bảng phân vùng (table partitioning) cho tải lớn.',
  },
]

export const mockUnifiedActionPlan: ActionPlanItem[] = [
  {
    priority: 'high',
    skillCode: 'DBDS',
    title: 'Nâng cao kỹ thuật thiết kế CSDL phân tán và phân vùng',
    topics: ['Table Partitioning', 'Sharding strategies', 'Read Replicas & Failover'],
    estimatedWeeks: 2,
  },
  {
    priority: 'medium',
    skillCode: 'PROG',
    title: 'Tối ưu hóa hiệu năng bộ nhớ và I/O bất đồng bộ',
    topics: ['Memory Profiling', 'Node.js Streams & Pipelines', 'Backpressure Handling'],
    estimatedWeeks: 1,
  },
]

export const mockUnifiedCriteriaQuestion1: BinaryCriterionResult[] = [
  {
    criteriaId: 'crit-dbds-core',
    dimension: 'core',
    passed: true,
    evidence:
      'Ứng viên phân tích đúng phương pháp EXPLAIN ANALYZE và tạo index đa cột để giảm cost từ Seq Scan về Index Scan.',
    deductionReason: null,
    criteriaText: 'Hiểu và phân tích được execution plan và indexing.',
  },
  {
    criteriaId: 'crit-dbds-seniority',
    dimension: 'seniority',
    passed: false,
    evidence:
      'Chưa trình bày được giải pháp phân vùng theo thời gian (range partitioning) khi bảng vượt quá 100 triệu bản ghi.',
    deductionReason: 'Thiếu kiến trúc phân vùng dữ liệu quy mô lớn cho Senior Level 4.',
    criteriaText: 'Thiết kế được chiến lược lưu trữ quy mô lớn và scale ngang.',
  },
]

export const mockUnifiedCriteriaQuestion2: BinaryCriterionResult[] = [
  {
    criteriaId: 'crit-prog-core',
    dimension: 'core',
    passed: true,
    evidence:
      'Nắm vững Event Loop của Node.js, Worker Threads cho tác vụ CPU-intensive và xử lý lỗi unhandled rejection.',
    deductionReason: null,
    criteriaText: 'Làm chủ xử lý bất đồng bộ và kiến trúc Event Loop.',
  },
  {
    criteriaId: 'crit-prog-seniority',
    dimension: 'seniority',
    passed: true,
    evidence:
      'Áp dụng thành thạo Distributed Lock bằng Redis Redlock để chống race condition giữa các microservices.',
    deductionReason: null,
    criteriaText: 'Xử lý triệt để bài toán đồng quy và phân tán.',
  },
]

export const mockUnifiedReport: Report = {
  sessionId: 'session-unified-1111-2222-3333',
  reportQuality: 'full',
  overallScore: 85,
  recommendationStatus: 'recommended',
  skillsBreakdown: mockUnifiedSkillsBreakdown,
  actionPlan: {
    actionPlan: mockUnifiedActionPlan,
  },
  executiveSummary: {
    overallScore: 85,
    targetSfiaLevel: 4,
    demonstratedSfiaLevel: 4,
    recommendationStatus: 'recommended',
    summary:
      'Ứng viên thể hiện nền tảng vững vàng, đáp ứng tốt yêu cầu kỹ thuật Level 4 cho vị trí Senior Developer.',
    evaluatedTurns: 2,
    fallbackTurns: 0,
  },
  competencyHeatmap: {},
  transcript: [
    {
      answerId: 'ans-1',
      questionText: 'Bạn tối ưu truy vấn SQL chậm trong cơ sở dữ liệu lớn như thế nào?',
      orderIndex: 1,
      answerText:
        'Tôi sử dụng EXPLAIN ANALYZE để kiểm tra execution plan, tìm các nút Seq Scan chậm và tạo Composite Index tương ứng.',
      skipped: false,
      overallScore: 75,
      modelAnswer:
        'Quy trình chuẩn: Phân tích EXPLAIN ANALYZE, đánh chỉ mục B-tree/GIN phù hợp, áp dụng Partitioning theo thời gian và cấu hình connection pool.',
      keyTakeaway: 'Phân tích indexing tốt nhưng cần bổ sung kiến thức partitioning.',
      isFallback: false,
      segments: [],
      criteriaEvaluations: mockUnifiedCriteriaQuestion1,
      demonstratedLevel: 3,
      criteriaPassRate: 0.5,
      strengths: ['EXPLAIN ANALYZE', 'Composite Index'],
      improvements: ['Range Partitioning', 'Scalability'],
    },
    {
      answerId: 'ans-2',
      questionText: 'Trình bày cách bạn xử lý bài toán race condition trong hệ thống phân tán?',
      orderIndex: 2,
      answerText:
        'Tôi sử dụng Redis Distributed Lock với thuật toán Redlock kèm TTL tự động gia hạn để đảm bảo chỉ một worker xử lý tại một thời điểm.',
      skipped: false,
      overallScore: 95,
      modelAnswer:
        'Sử dụng cơ chế Distributed Lock (Redis Redlock hoặc PostgreSQL Advisory Locks) kết hợp Idempotency Key.',
      keyTakeaway: 'Nắm rất vững xử lý đồng quy phân tán.',
      isFallback: false,
      segments: [],
      criteriaEvaluations: mockUnifiedCriteriaQuestion2,
      demonstratedLevel: 4,
      criteriaPassRate: 1.0,
      strengths: ['Redis Redlock', 'Worker Isolation'],
      improvements: [],
    },
  ],
}

export const mockLegacyReport: Report = {
  sessionId: 'session-legacy-4444-5555-6666',
  reportQuality: 'full',
  overallScore: 74,
  actionPlan: {
    items: [
      'Nâng cao kỹ năng giao tiếp và truyền đạt kỹ thuật',
      'Tìm hiểu sâu hơn về kiến trúc đám mây AWS',
    ],
  },
  executiveSummary: {
    overallScore: 74,
    summary: 'Báo cáo phiên bản cũ được đánh giá theo mô hình rubric đa chiều D1-D6.',
  },
  competencyHeatmap: {
    D1: 75,
    D2: 70,
    D3: 80,
  },
  transcript: [
    {
      answerId: 'ans-legacy-1',
      questionText: 'Hãy mô tả một dự án gần nhất bạn đã tham gia?',
      orderIndex: 1,
      answerText: 'Tôi tham gia dự án thương mại điện tử phụ trách phần giỏ hàng và thanh toán.',
      skipped: false,
      overallScore: 74,
      modelAnswer: 'Cấu trúc theo mô hình STAR: Situation, Task, Action, Result.',
      keyTakeaway: 'Cần trình bày định lượng kết quả dự án rõ ràng hơn.',
      isFallback: false,
      segments: [],
      appliedDimensions: [
        { id: 'D1', name: 'Kỹ năng giao tiếp', score: 75, weight: 30 },
        { id: 'D2', name: 'Tư duy giải quyết vấn đề', score: 70, weight: 30 },
      ],
    },
  ],
}

export const mockSkippedTurnsReport: Report = {
  sessionId: 'session-skipped-7777-8888-9999',
  reportQuality: 'partial',
  overallScore: 48,
  recommendationStatus: 'not_recommended',
  skillsBreakdown: [
    {
      skillCode: 'PROG',
      skillName: 'Phát triển Phần mềm',
      techContext: ['TypeScript'],
      targetLevel: 4,
      demonstratedLevel: 2,
      score: 48,
      status: 'gap',
      strengths: 'Trả lời được câu hỏi cơ bản mở đầu.',
      areasForImprovement: 'Đã bỏ qua câu hỏi thiết kế kiến trúc nâng cao.',
    },
  ],
  actionPlan: {
    actionPlan: [
      {
        priority: 'high',
        skillCode: 'PROG',
        title: 'Ôn tập toàn diện kiến thức cốt lõi',
        topics: ['Microservices Design', 'Concurrency Patterns'],
        estimatedWeeks: 3,
      },
    ],
  },
  executiveSummary: {
    overallScore: 48,
    targetSfiaLevel: 4,
    demonstratedSfiaLevel: 2,
    recommendationStatus: 'not_recommended',
    summary: 'Ứng viên chưa hoàn thành đủ số lượng câu hỏi yêu cầu trong phiên.',
    evaluatedTurns: 1,
    fallbackTurns: 0,
  },
  competencyHeatmap: {},
  transcript: [
    {
      answerId: 'ans-skip-1',
      questionText: 'Mô tả nguyên lý SOLID trong thiết kế hướng đối tượng?',
      orderIndex: 1,
      answerText: 'SOLID gồm 5 nguyên lý: Single Responsibility, Open-Closed, Liskov, Interface Segregation, Dependency Inversion.',
      skipped: false,
      overallScore: 85,
      modelAnswer: 'Giải thích chi tiết 5 nguyên lý kèm ví dụ thực tế.',
      keyTakeaway: 'Nắm vững lý thuyết hướng đối tượng.',
      isFallback: false,
      segments: [],
      criteriaEvaluations: [
        {
          criteriaId: 'c-solid-1',
          dimension: 'core',
          passed: true,
          evidence: 'Nêu đầy đủ và chính xác 5 chữ cái viết tắt.',
          deductionReason: null,
        },
      ],
      demonstratedLevel: 3,
      criteriaPassRate: 1.0,
      strengths: ['SOLID Principles'],
      improvements: [],
    },
    {
      answerId: 'ans-skip-2',
      questionText: 'Làm thế nào để thiết kế một hệ thống Event-Driven với Apache Kafka đảm bảo Exactly-Once Processing?',
      orderIndex: 2,
      answerText: '',
      skipped: true,
      overallScore: 0,
      modelAnswer:
        'Để đảm bảo Exactly-Once: Sử dụng Kafka Idempotent Producer, Transactional API giữa Read-Process-Write, và cấu hình isolation.level = read_committed.',
      keyTakeaway: 'Ứng viên đã bỏ qua câu hỏi này.',
      isFallback: false,
      segments: [],
      demonstratedLevel: 1,
      criteriaPassRate: 0,
      strengths: [],
      improvements: ['Kafka Exactly-Once Semantics', 'Distributed Transactions'],
    },
  ],
}
