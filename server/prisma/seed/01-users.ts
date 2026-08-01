import { AccountStatus, UserRole, type PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { hashPassword } from '../../src/auth/password';
import { DEMO_EMAIL, DEMO_PASSWORD } from './_client';

export async function getOrCreateDemoUser(prisma: PrismaClient): Promise<string> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      id: randomUUID(), email: DEMO_EMAIL, passwordHash, passwordUpdatedAt: new Date(),
      role: UserRole.user, status: AccountStatus.active,
    },
    update: { status: AccountStatus.active },
  });
  return user.id;
}

export async function getOrCreateAdminUser(prisma: PrismaClient): Promise<string | undefined> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email && !password) return undefined;
  if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured together');
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      id: randomUUID(), email, passwordHash: await hashPassword(password), passwordUpdatedAt: new Date(),
      role: UserRole.admin, status: AccountStatus.active,
    },
    update: {
      passwordHash: await hashPassword(password), passwordUpdatedAt: new Date(), role: UserRole.admin,
      status: AccountStatus.active, tokenVersion: { increment: 1 },
    },
  });
  console.log(`admin user: ready (${user.id})`);
  return user.id;
}

export async function seedUserProfile(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, fullName: 'Nguyễn Văn Demo', education: {}, workExperience: [], projects: [], technicalSkills: [], certifications: [], awards: [] },
    update: {},
  });
}
