import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext } from '@nestjs/common';
import { SseTokenGuard } from './sse-token.guard';
import { createMockConfigService } from '../../test-utils/mock-factories';
import { PrismaService } from '../../prisma/prisma.service';

describe('SseTokenGuard', () => {
  let guard: SseTokenGuard;
  let mockPrisma: { user: { upsert: jest.Mock } };

  beforeEach(async () => {
    const mockConfig = createMockConfigService({
      MOCK_USER_ID: '110235ac-6613-4ef3-bdff-715f4cd5d7fc',
    });
    mockPrisma = {
      user: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SseTokenGuard,
        { provide: ConfigService, useValue: mockConfig },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<SseTokenGuard>(SseTokenGuard);
  });

  afterEach(() => jest.clearAllMocks());

  it('luôn cho qua và set demo user cho MVP', async () => {
    const req = {
      query: {},
      user: undefined as unknown,
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect((req.user as { id: string }).id).toBe(
      '110235ac-6613-4ef3-bdff-715f4cd5d7fc',
    );
    expect(mockPrisma.user.upsert).toHaveBeenCalled();
  });
});
