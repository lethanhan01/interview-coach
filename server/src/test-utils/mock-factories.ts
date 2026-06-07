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
  },
  userAnswer: {
    findMany: jest.fn(),
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
