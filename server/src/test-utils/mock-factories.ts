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
      rubricCriterion: {
        id: string;
        code: string;
        name: string;
        weight: number;
        displayOrder: number;
        rubricCategory: {
          categoryKey: string;
          displayOrder: number;
          rubricVersion: {
            id: string;
            contextPackId: string;
            status: string;
          };
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
      rubricCriterion: {
        id: 'criterion-D4',
        code: 'D4',
        name: 'Communication',
        weight: 1,
        displayOrder: 4,
        rubricCategory: {
          categoryKey: 'behavioral',
          displayOrder: 1,
          rubricVersion: {
            id: 'rubric-version-vn',
            contextPackId: 'VN',
            status: 'active',
          },
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
    rubricCriterion: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    rubricVersion: {
      findFirst: jest.fn().mockResolvedValue(null),
      upsert: jest.fn(),
    },
    rubricCategory: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(),
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
    sessionQuestionCriterion: {
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    followUpQuestion: {
      create: jest.fn(),
    },
    userAnswer: {
      create: jest.fn(),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
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
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    userProfile: {
      upsert: jest.fn(),
    },
    userVerificationCode: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    savedJobDescription: {
      findMany: jest.fn(),
      findFirst: jest.fn().mockResolvedValue({
        id: 'sjd-12345678-1234-4234-8234-123456789012',
        userId: 'user-abc',
      }),
      create: jest.fn(),
      update: jest.fn(),
    },
    sessionReport: {
      upsert: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    workflowOutbox: {
      upsert: jest.fn(),
    },
  };
  return prisma;
};

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
  emit: jest.fn(),
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
});

export const createMockQuestionBankService = () => ({
  selectFallbackQuestions: jest.fn().mockResolvedValue([]),
});

export const createMockQuestionCriteriaService = () => ({
  codesFromQuestionBank: jest.fn((question) =>
    question.criteria.map((link) => link.rubricCriterion.code),
  ),
  codesFromSessionQuestion: jest.fn((question) =>
    question.criteria.map(
      (link) => link.rubricCriterion?.code ?? link.criterionCode,
    ),
  ),
  buildSessionQuestionCriteriaData: jest.fn().mockResolvedValue([
    {
      sessionQuestionId: 'question-1',
      rubricCriterionId: 'criterion-1',
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
