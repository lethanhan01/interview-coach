import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export const MVP_USER_ID = '00000000-0000-4000-8000-000000000001';

export function isAuthEnabled(config: ConfigService): boolean {
  void config;
  return false;
}

export function getMvpUserId(config: ConfigService): string {
  return config.get<string>('MOCK_USER_ID') || MVP_USER_ID;
}

export async function ensureMvpUser(
  prisma: PrismaService,
  userId: string,
): Promise<void> {
  await prisma.user.upsert({
    where: { id: userId },
    update: {
      status: 'active',
    },
    create: {
      id: userId,
      email: `mvp-${userId}@interviewcoach.local`,
      role: 'candidate',
      status: 'active',
    },
  });
}
