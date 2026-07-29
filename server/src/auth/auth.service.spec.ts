import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  const prisma = { user: { upsert: jest.fn(), findUnique: jest.fn() } };
  const config = { getOrThrow: jest.fn((key: string) => key === 'SUPABASE_URL' ? 'https://example.supabase.co' : 'anon-key') };
  let service: AuthService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({ providers: [AuthService, { provide: PrismaService, useValue: prisma }, { provide: ConfigService, useValue: config }] }).compile();
    service = module.get(AuthService); jest.clearAllMocks();
  });
  it('creates first-login users with the user role', async () => {
    prisma.user.upsert.mockResolvedValue({ id: 'u1' });
    await service.ensureUser('u1', 'user@example.com');
    expect(prisma.user.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ role: 'user', status: 'active' }) }));
  });
  it('looks up the current DB user', async () => {
    await service.getMe('u1'); expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });
});
