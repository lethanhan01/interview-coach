import 'dotenv/config';
import { PrismaClient, AccountStatus } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const execute = process.argv.includes('--execute');
const resetUrl = process.env.PASSWORD_RESET_URL ?? 'http://localhost:5173/reset-password';

function hash(token: string): string {
  return createHash('sha256').update(token).digest('base64url');
}

async function main(): Promise<void> {
  const users = await prisma.user.findMany({ where: { status: { not: AccountStatus.deleted } }, select: { id: true, email: true } });
  console.log(`${execute ? 'EXECUTE' : 'DRY RUN'}: ${users.length} account(s) will require a password reset.`);
  if (!execute) return;

  const mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST!, port: Number(process.env.SMTP_PORT ?? 587), secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASSWORD! },
  });
  for (const user of users) {
    const token = randomBytes(32).toString('base64url');
    const url = new URL(resetUrl); url.searchParams.set('token', token);
    await prisma.user.update({ where: { id: user.id }, data: { status: AccountStatus.password_reset_required, passwordHash: null, passwordResetTokenHash: hash(token), passwordResetExpiresAt: new Date(Date.now() + 30 * 60 * 1000), tokenVersion: { increment: 1 } } });
    await mailer.sendMail({ from: process.env.SMTP_FROM!, to: user.email, subject: 'Đặt lại mật khẩu InterviewCoach', text: `Đặt lại mật khẩu tại: ${url}` });
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  for (const authUser of data.users) {
    const result = await supabase.auth.admin.deleteUser(authUser.id);
    if (result.error) throw result.error;
  }
  console.log(`Deleted ${data.users.length} Supabase Auth user(s).`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
