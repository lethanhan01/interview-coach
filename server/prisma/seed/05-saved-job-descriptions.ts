import type { PrismaClient } from '@prisma/client';

export async function seedSavedJobDescriptions(
  prisma: PrismaClient,
  userId: string,
): Promise<void> {
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  const jds = [
    {
      companyName: 'FPT Software',
      companyWebsite: 'https://fptsoftware.com',
      jobTitle: 'Backend Developer',
      headcount: '2',
      location: 'Hà Nội',
      requirements:
        'Tối thiểu 2 năm kinh nghiệm backend. Thành thạo Node.js hoặc Java Spring Boot. Có kinh nghiệm với RESTful API, SQL/NoSQL database. Tiếng Anh đọc hiểu tài liệu kỹ thuật.',
      jobContent:
        'Phát triển và bảo trì các microservice backend. Tham gia thiết kế kiến trúc hệ thống. Phối hợp với team frontend và DevOps. Review code cho các thành viên junior.',
      techStack: ['Node.js', 'PostgreSQL', 'Docker', 'Redis'],
      benefits: 'Bảo hiểm sức khỏe, 12 ngày phép, MacBook Pro',
      salary: '20-35 triệu VNĐ',
      bonus: 'Tháng 13 (1 lần/năm)',
      lastUsedAt: daysAgo(3),
    },
    {
      companyName: 'Shopee Vietnam',
      companyWebsite: 'https://shopee.vn',
      jobTitle: 'Frontend Developer',
      headcount: '3',
      location: 'TP. Hồ Chí Minh',
      requirements:
        'Trên 1 năm kinh nghiệm frontend với React hoặc Vue. Nắm vững HTML/CSS/JavaScript ES6+. Có kinh nghiệm với TypeScript và state management (Redux/Zustand). Hiểu biết về performance optimization.',
      jobContent:
        'Xây dựng UI cho các tính năng e-commerce. Tối ưu hiệu năng trang web. Phối hợp chặt chẽ với UI/UX designer và backend. Viết unit test và documentation.',
      techStack: ['React', 'TypeScript', 'Redux', 'Tailwind CSS'],
      benefits: 'Ăn trưa miễn phí, gym, bảo hiểm sức khỏe premium',
      salary: '25-40 triệu VNĐ',
      bonus: 'Theo KPI',
      lastUsedAt: daysAgo(10),
    },
    {
      companyName: 'VNG Corporation',
      companyWebsite: 'https://vng.com.vn',
      jobTitle: 'Full-stack Developer',
      headcount: '1',
      location: 'TP. Hồ Chí Minh',
      requirements:
        'Có 2-4 năm kinh nghiệm full-stack. Thành thạo React/Next.js và Node.js/Go. Kinh nghiệm với hệ thống quy mô lớn, high traffic. Hiểu biết cơ bản về cloud (AWS/GCP).',
      jobContent:
        'Phát triển tính năng end-to-end từ database đến UI. Thiết kế và triển khai API. Tham gia on-call rotation và hỗ trợ production. Mentoring junior developer.',
      techStack: ['React', 'Node.js', 'Go', 'Kubernetes', 'PostgreSQL'],
      benefits: 'Stock option, remote hybrid, bảo hiểm cao cấp',
      salary: '35-55 triệu VNĐ',
      bonus: '2 lần/năm',
      lastUsedAt: daysAgo(21),
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const jd of jds) {
    const existing = await prisma.savedJobDescription.findFirst({
      where: { userId, companyName: jd.companyName, jobTitle: jd.jobTitle },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.savedJobDescription.create({ data: { ...jd, userId } });
    created++;
  }

  console.log(`saved-job-descriptions: created=${created}, skipped=${skipped}`);
}
