import { AccountStatus, UserRole, type PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { hashPassword } from '../../src/modules/auth/password';
import { DEMO_EMAIL, DEMO_PASSWORD } from './_client';

const DEMO_ACCOUNTS = [
  {
    email: DEMO_EMAIL,
    firstname: 'Lê Thành',
    lastname: 'An',
    role: UserRole.candidate,
  },
  {
    email: 'hungletai@gmail.com',
    firstname: 'Admin',
    lastname: 'đẹp trai',
    role: UserRole.admin,
  },
] as const;

export async function seedDemoUsers(prisma: PrismaClient): Promise<string> {
  const passwordHashes = await Promise.all(DEMO_ACCOUNTS.map(() => hashPassword(DEMO_PASSWORD)));

  return prisma.$transaction(async (tx) => {
    let demoUserId = '';

    for (const [index, account] of DEMO_ACCOUNTS.entries()) {
      const user = await tx.user.upsert({
        where: { email: account.email },
        create: {
          id: randomUUID(),
          email: account.email,
          firstname: account.firstname,
          lastname: account.lastname,
          passwordHash: passwordHashes[index],
          role: account.role,
          status: AccountStatus.active,
        },
        update: {
          firstname: account.firstname,
          lastname: account.lastname,
          passwordHash: passwordHashes[index],
          role: account.role,
          status: AccountStatus.active,
          tokenVersion: { increment: 1 },
        },
      });
      await tx.userVerificationCode.deleteMany({
        where: { userId: user.id, purpose: 'password_reset_otp' },
      });
      if (account.email === DEMO_EMAIL) demoUserId = user.id;
    }

    return demoUserId;
  });
}

export async function seedUserProfile(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      education: {},
      workExperience: [],
      projects: [],
      technicalSkills: [],
      certifications: [],
      awards: [],
    },
    update: {},
  });
}
