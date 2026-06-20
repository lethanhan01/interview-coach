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
        profileCompleted: false,
      },
    });
  }

  return userId;
}

export async function seedUserProfile(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  const existing = await prisma.userProfile.findUnique({ where: { userId } });
  if (existing) {
    console.log('user profile: already exists, skipping');
    return;
  }

  await prisma.userProfile.create({
    data: {
      userId,
      fullName: 'Nguyễn Văn Demo',
      targetPosition: 'Junior Backend Developer',
      targetRoleCategory: 'backend',
      targetLevel: 'junior',
      preferredTechStack: 'Node.js, NestJS, PostgreSQL',
      yearsExperience: 0,
      defaultLanguage: 'vi',
      ttsEnabled: false,
      gender: 'male',
      phone: '0912345678',
      hometown: 'Hà Nội',
      nationality: 'Việt Nam',
      education: [
        {
          school: 'Đại học Bách Khoa Hà Nội',
          major: 'Công nghệ thông tin',
          graduationYear: 2025,
          gpa: 3.2,
        },
      ],
      workExperience: [],
      projects: [
        {
          name: 'Interview Coach',
          description: 'Hệ thống luyện phỏng vấn AI cho sinh viên IT Việt Nam',
          techStack: ['NestJS', 'Next.js', 'PostgreSQL', 'OpenAI'],
          role: 'Backend Developer',
          duration: '4 tháng',
        },
      ],
      technicalSkills: {
        languages: ['JavaScript', 'TypeScript', 'Java'],
        frameworks: ['NestJS', 'React', 'Next.js'],
        databases: ['PostgreSQL', 'Redis'],
        tools: ['Git', 'Docker', 'Postman'],
      },
    },
  });
  console.log('user profile: created');
}
