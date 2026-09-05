export const createMockQuestionBank = (
  overrides: Partial<{
    id: string;
    content: string;
    sessionType: string;
    difficulty: number;
    contextPackId: string;
    estimatedTimeMin: number | null;
    translations: Record<string, string> | null;
    contentJson: Record<string, unknown> | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    criteria: Array<{
      criteria: {
        id: string;
        code: string;
        name: string;
        weight: number;
        displayOrder: number;
        competency: {
          code: string;
          name: string;
          categoryCode: string;
          categoryName: string;
        };
      };
    }>;
  }> = {},
) => ({
  id: 'qb-test-id',
  content: 'Tell me about yourself.',
  sessionType: 'hr',
  difficulty: 2,
  contextPackId: 'VN',
  estimatedTimeMin: 5,
  translations: {
    en: 'Tell me about yourself.',
    vi: 'Hãy giới thiệu về bản thân bạn.',
  },
  contentJson: null,
  deletedAt: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  criteria: [
    {
      criteria: {
        id: 'level-PROG-L4',
        code: 'PROG-L4',
        name: 'Software development - Level 4',
        weight: 1,
        displayOrder: 4,
        competency: {
          code: 'PROG',
          name: 'Software development',
          categoryCode: 'DEV_IMPL',
          categoryName: 'Development and implementation',
        },
      },
    },
  ],
  ...overrides,
});

export const createMockPrismaService = () => {
  const prisma = {
    $transaction: jest.fn((input) =>
      typeof input === 'function' ? input(prisma) : Promise.all(input),
    ),
    isBootstrapDatabaseAvailable: jest.fn().mockReturnValue(true),
    skillLevel: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    criteria: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    skill: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    competency: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    level: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({ id: 'lvl-4', rank: 4, name: 'Apply', code: 'LV4' }),
    },
    role: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    roleSkill: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    roleLevelCompetency: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    sessionSkill: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    sessionCompetency: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    questionBankSkillLevel: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    questionBankCriterion: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    sessionQuestionSkillLevel: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    sessionQuestionCriterion: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
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
    interviewSession: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 'session-123' }),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ id: 'session-123' }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    sessionQuestion: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      count: jest.fn().mockResolvedValue(0),
    },
    followUpQuestion: {
      create: jest.fn().mockResolvedValue({ id: 'fu-1' }),
    },
    userAnswer: {
      create: jest.fn().mockResolvedValue({ id: 'ua-123' }),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ id: 'ua-123' }),
      upsert: jest.fn().mockResolvedValue({ id: 'ua-123' }),
      count: jest.fn().mockResolvedValue(0),
    },
    aiFeedback: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'af-123' }),
      upsert: jest.fn().mockResolvedValue({ id: 'af-123' }),
    },
    user: {
      create: jest.fn().mockResolvedValue({ id: 'user-1' }),
      update: jest.fn().mockResolvedValue({ id: 'user-1' }),
      upsert: jest.fn().mockResolvedValue({ id: 'user-1' }),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
    },
    userProfile: {
      upsert: jest.fn().mockResolvedValue({ id: 'profile-1' }),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    userVerificationCode: {
      upsert: jest.fn().mockResolvedValue({ id: 'code-1' }),
      findUnique: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue({ id: 'code-1' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    savedJobDescription: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({
        id: 'sjd-12345678-1234-4234-8234-123456789012',
        userId: 'user-abc',
        onetSocCode: '15-1252.00',
        targetSfiaLevel: 3,
        normalizedTechStack: ['Node.js', 'PostgreSQL'],
      }),
      create: jest.fn().mockResolvedValue({ id: 'sjd-123', userId: 'user-abc' }),
      update: jest.fn().mockResolvedValue({ id: 'sjd-123' }),
    },
    onetSfiaMapping: {
      findMany: jest.fn().mockResolvedValue([]),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    sessionReport: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'sr-123' }),
      upsert: jest.fn().mockResolvedValue({ id: 'sr-123' }),
    },
    workflowOutbox: {
      create: jest.fn().mockResolvedValue({ id: 'wo-123' }),
      upsert: jest.fn().mockResolvedValue({ id: 'wo-123' }),
    },
    companyProfile: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
  };
  return prisma;
};

export const createMockQueue = () => ({
  add: jest.fn().mockResolvedValue({ id: 'job-123' }),
  getJob: jest.fn().mockResolvedValue(null),
});

export const createMockConfigService = (
  overrides: Record<string, string | number | boolean> = {},
) => ({
  getOrThrow: jest.fn((key: string) => overrides[key] ?? `mock-${key}`),
  get: jest.fn((key: string) => overrides[key] ?? `mock-${key}`),
});

export const createMockWhisperService = () => ({
  transcribe: jest.fn().mockResolvedValue({
    text: 'Transcribed text sample',
    durationSeconds: 30,
  }),
});

export const createMockVoiceMetricsService = () => ({
  calculate: jest.fn().mockReturnValue({
    wpm: 120,
    fillerWords: 2,
    pauses: 1,
  }),
});

export const createMockReportService = () => ({
  getReport: jest.fn(),
  getFeedbackProgress: jest.fn().mockResolvedValue({
    sessionId: 'session-123',
    status: 'completing',
    totalQuestions: 1,
    answeredQuestions: 1,
    skippedQuestions: 0,
    feedbackRequired: 1,
    feedbackCompleted: 1,
    feedbackPending: 0,
    reportReady: false,
  }),
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
  emit: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn(),
});

export const createMockAuthService = () => ({
  ensureUser: jest.fn(),
  getMe: jest.fn(),
  validateAccessToken: jest.fn(),
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

export const createMockWorkflowService = () => ({
  enqueueInTransaction: jest.fn(),
});

export const createMockWorkflowDispatcher = () => ({
  dispatchFor: jest.fn().mockResolvedValue(undefined),
});

export const createMockOpenAIGateway = () => ({
  chatCompletion: jest.fn(),
  getChatModel: jest.fn().mockReturnValue('google/gemma-4-e4b'),
  transcribe: jest.fn(),
  generateStructured: jest.fn(),
  generateText: jest.fn(),
  transcribeAudio: jest.fn(),
});

export const createMockAIGateway = createMockOpenAIGateway;

export const createMockQuestionBankService = () => ({
  selectFallbackQuestions: jest.fn().mockResolvedValue([]),
});

export const createMockQuestionCriteriaService = () => ({
  codesFromQuestionBank: jest.fn().mockReturnValue(['PROG-L4']),
  codesFromSessionQuestion: jest.fn().mockReturnValue(['PROG-L4']),
  buildSessionQuestionCriteriaData: jest.fn().mockResolvedValue([
    {
      sessionQuestionId: 'sq-1',
      criteriaId: 'lvl-1',
    },
  ]),
});

export const createMockPromptBuilderService = () => ({
  buildBaseSystem: jest.fn(),
  applyContextPack: jest.fn(),
  applyContextPackForEvaluation: jest.fn(),
  injectDynamicContext: jest.fn(),
});

export const createMockZodValidatorService = () => ({
  validate: jest.fn(),
});

export const createMockContextPackService = () => ({
  getContextPack: jest.fn(),
  getRubricSnapshot: jest.fn().mockResolvedValue({}),
});

export const createMockPipelineStrategyFactory = () => ({
  getStrategy: jest.fn(),
});
