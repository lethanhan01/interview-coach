export const createMockPrismaService = () => ({
  interviewSession: {
    count: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  sessionQuestion: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    createMany: jest.fn(),
  },
  followUpQuestion: {
    create: jest.fn(),
  },
  userAnswer: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  userProfile: {
    upsert: jest.fn(),
  },
});

export const createMockQueue = () => ({
  add: jest.fn(),
});

export const createMockConfigService = (
  overrides: Record<string, string> = {},
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

export const createMockFollowUpCoordinatorService = () => ({
  shouldGenerateFollowUp: jest.fn(),
});

export const createMockReportService = () => ({
  getReport: jest.fn(),
  enqueueReport: jest.fn(),
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
});

export const createMockUserService = () => ({
  getProfile: jest.fn(),
  upsertProfile: jest.fn(),
});

export const createMockOpenAIGateway = () => ({
  chatCompletion: jest.fn(),
  transcribe: jest.fn(),
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
