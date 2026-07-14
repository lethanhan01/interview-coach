import type { PrismaClient } from '@prisma/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DEMO_EMAIL, DEMO_PASSWORD } from './_client';

export async function getOrCreateDemoUser(
  supabaseAdmin: SupabaseClient,
  prisma: PrismaClient,
): Promise<string> {
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
  const existing = listData?.users?.find((u) => u.email === DEMO_EMAIL);

  let userId: string;
  if (existing) {
    console.log(`demo user: already exists (${existing.id})`);
    userId = existing.id;
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Failed to create demo user: ${error?.message}`);
    }
    console.log(`demo user: created (${data.user.id})`);
    userId = data.user.id;
    await new Promise((r) => setTimeout(r, 1500));
  }

  let publicUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!publicUser) {
    for (let i = 0; i < 5; i++) {
      publicUser = await prisma.user.findUnique({ where: { id: userId } });
      if (publicUser) break;
      console.log(
        `Waiting for auth trigger to sync user (attempt ${i + 1}/5)...`,
      );
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  if (!publicUser) {
    console.log('Auth trigger did not fire — inserting user manually');
    await prisma.user.create({
      data: {
        id: userId,
        email: DEMO_EMAIL,
        role: 'candidate',
        status: 'active',
      },
    });
  }

  return userId;
}

export async function seedUserProfile(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      fullName: 'Nguyễn Văn Demo',
      education: {
        degree: 'Kỹ sư',
        school: 'Đại học Bách Khoa Hà Nội',
        major: 'Công nghệ thông tin',
        graduationYear: '2025',
        gpa: '3.2',
      },
      workExperience: [],
      projects: [
        {
          id: 'demo-project-interview-coach',
          name: 'Interview Coach',
          description: 'Hệ thống luyện phỏng vấn AI cho sinh viên IT Việt Nam',
          techStack: ['NestJS', 'Next.js', 'PostgreSQL', 'OpenAI'],
          url: '',
          startDate: '2026-03',
          endDate: '2026-07',
          isCurrent: false,
        },
      ],
      technicalSkills: [
        { id: 'demo-skill-ts', category: 'language', name: 'TypeScript', usagePeriod: 2 },
        { id: 'demo-skill-nest', category: 'framework', name: 'NestJS', usagePeriod: 1 },
        { id: 'demo-skill-next', category: 'framework', name: 'Next.js', usagePeriod: 1 },
        { id: 'demo-skill-postgres', category: 'database', name: 'PostgreSQL', usagePeriod: 1 },
      ],
      certifications: [],
      awards: [],
    },
    update: {
      fullName: 'Nguyễn Văn Demo',
      education: {
        degree: 'Kỹ sư',
        school: 'Đại học Bách Khoa Hà Nội',
        major: 'Công nghệ thông tin',
        graduationYear: '2025',
        gpa: '3.2',
      },
      workExperience: [],
      projects: [
        {
          id: 'demo-project-interview-coach',
          name: 'Interview Coach',
          description: 'Hệ thống luyện phỏng vấn AI cho sinh viên IT Việt Nam',
          techStack: ['NestJS', 'Next.js', 'PostgreSQL', 'OpenAI'],
          url: '',
          startDate: '2026-03',
          endDate: '2026-07',
          isCurrent: false,
        },
      ],
      technicalSkills: [
        { id: 'demo-skill-ts', category: 'language', name: 'TypeScript', usagePeriod: 2 },
        { id: 'demo-skill-nest', category: 'framework', name: 'NestJS', usagePeriod: 1 },
        { id: 'demo-skill-next', category: 'framework', name: 'Next.js', usagePeriod: 1 },
        { id: 'demo-skill-postgres', category: 'database', name: 'PostgreSQL', usagePeriod: 1 },
      ],
      certifications: [],
      awards: [],
    },
  });
  console.log('user profile: upserted');
}
