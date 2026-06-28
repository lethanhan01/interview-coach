export const createMockQuestionBank = (
  overrides: Partial<{
    id: string;
    content: string;
    sessionType: string;
    difficulty: number;
    contextPackId: string;
    subcategory: string;
    competencyDomain: string;
    applicableRoles: string[];
    applicableLevels: string[];
    tags: string[];
    estimatedTimeMin: number | null;
    translations: Record<string, string> | null;
    contentJson: Record<string, unknown> | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) => ({
  id: 'qb-test-id',
  content: 'Tell me about yourself.',
  sessionType: 'hr',
  difficulty: 2,
  contextPackId: 'VN',
  subcategory: 'self-introduction',
  competencyDomain: 'D4',
  applicableRoles: ['all'],
  applicableLevels: ['junior', 'mid'],
  tags: ['hr', 'self-introduction'],
  estimatedTimeMin: 5,
  translations: {
    en: 'Tell me about yourself.',
    vi: 'Hãy giới thiệu về bản thân bạn.',
  },
  contentJson: null,
  deletedAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

export const createMockPrismaService = () => ({
  $transaction: jest.fn(),
  questionBank: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue(createMockQuestionBank()),
    createMany: jest.fn().mockResolvedValue({ count: 0 }),
    update: jest.fn().mockResolvedValue(createMockQuestionBank()),
    upsert: jest.fn().mockResolvedValue(createMockQuestionBank()),
    delete: jest.fn().mockResolvedValue(createMockQuestionBank()),
    count: jest.fn().mockResolvedValue(0),
  },
  questionUsage: {
    create: jest.fn().mockResolvedValue({ id: 'usage-1' }),
    count: jest.fn().mockResolvedValue(0),
  },
  interviewSession: {
    count: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  sessionQuestion: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn(),
  },
  followUpQuestion: {
    create: jest.fn(),
  },
  userAnswer: {
    create: jest.fn(),
    findUnique: jest.fn().mockResolvedValue(null),
    findMany: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  aiFeedback: {
    upsert: jest.fn().mockResolvedValue({ id: 'feedback-1' }),
    findUnique: jest.fn().mockResolvedValue(null),
  },
  user: {
    findUnique: jest.fn(),
  },
  userProfile: {
    upsert: jest.fn(),
  },
  resume: {
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    update: jest.fn(),
  },
  savedJobDescription: {
    findMany: jest.fn(),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn(),
    update: jest.fn(),
  },
  sessionReport: {
    upsert: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
  },
});

export const createMockQueue = () => ({
  add: jest.fn(),
  getJob: jest.fn().mockResolvedValue(null),
});

export const createMockConfigService = (
  overrides: Record<string, string | number | boolean> = {},
) => ({
  getOrThrow: jest.fn((key: string) => overrides[key] ?? `mock-${key}`),
  get: jest.fn((key: string) => overrides[key] ?? `mock-${key}`),
});

export const createMockWhisperService = () => ({
  transcribe: jest.fn(),
});

export const createMockVoiceMetricsService = () => ({
  calculate: jest.fn(),
});

export const createMockReportService = () => ({
  getReport: jest.fn(),
  enqueueReport: jest.fn().mockResolvedValue(undefined),
  enqueueIfAllFeedbacksReady: jest.fn().mockResolvedValue(undefined),
});

export const createMockSessionService = () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  findQuestions: jest.fn(),
  updateStatus: jest.fn(),
});

export const createMockSseService = () => ({
  emit: jest.fn(),
  subscribe: jest.fn(),
});

export const createMockAuthService = () => ({
  refreshToken: jest.fn(),
  logout: jest.fn(),
});

export const createMockTurnService = () => ({
  submitAnswer: jest.fn(),
  uploadAudio: jest.fn(),
});

export const createMockUserService = () => ({
  getProfile: jest.fn(),
  upsertProfile: jest.fn(),
});

export const createMockOpenAIGateway = () => ({
  chatCompletion: jest.fn(),
  getChatModel: jest.fn().mockReturnValue('google/gemma-4-e4b'),
  transcribe: jest.fn(),
});

export const createMockQuestionBankService = () => ({
  selectFallbackQuestions: jest.fn().mockResolvedValue([]),
  recordUsage: jest.fn().mockResolvedValue(undefined),
});

export const createMockPromptBuilderService = () => ({
  buildBaseSystem: jest.fn(),
  applyContextPack: jest.fn(),
  injectDynamicContext: jest.fn(),
});

export const createMockZodValidatorService = () => ({
  validate: jest.fn(),
});

export const createMockContextPackService = () => ({
  getContextPack: jest.fn(),
});

export const createMockPipelineStrategyFactory = () => ({
  getStrategy: jest.fn(),
});
