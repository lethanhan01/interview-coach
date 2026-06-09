export const GENDER_OPTIONS = [
  { value: '', label: 'Chọn giới tính' },
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
]

export const NATIONALITY_OPTIONS = [
  { value: '', label: 'Chọn quốc tịch' },
  { value: 'VN', label: 'Việt Nam' },
  { value: 'US', label: 'Hoa Kỳ' },
  { value: 'SG', label: 'Singapore' },
  { value: 'JP', label: 'Nhật Bản' },
  { value: 'KR', label: 'Hàn Quốc' },
  { value: 'AU', label: 'Úc' },
  { value: 'GB', label: 'Anh' },
  { value: 'DE', label: 'Đức' },
  { value: 'other', label: 'Khác' },
]

export const PERSONALITY_OPTIONS = [
  { value: '', label: 'Chọn tính cách' },
  { value: 'introvert', label: 'Hướng nội (Introvert)' },
  { value: 'extrovert', label: 'Hướng ngoại (Extrovert)' },
  { value: 'ambivert', label: 'Vừa hướng nội vừa hướng ngoại (Ambivert)' },
  { value: 'analytical', label: 'Phân tích (Analytical)' },
  { value: 'creative', label: 'Sáng tạo (Creative)' },
  { value: 'leader', label: 'Lãnh đạo (Leader)' },
  { value: 'teamplayer', label: 'Làm việc nhóm tốt (Team Player)' },
]

export const TARGET_POSITION_OPTIONS = [
  { value: '', label: 'Chọn vị trí mục tiêu' },
  { value: 'frontend', label: 'Frontend Developer' },
  { value: 'backend', label: 'Backend Developer' },
  { value: 'fullstack', label: 'Fullstack Developer' },
  { value: 'mobile', label: 'Mobile Developer' },
  { value: 'devops', label: 'DevOps Engineer' },
  { value: 'data', label: 'Data Engineer / Analyst' },
  { value: 'ml', label: 'Machine Learning Engineer' },
  { value: 'qa', label: 'QA Engineer' },
  { value: 'pm', label: 'Product Manager' },
  { value: 'designer', label: 'UI/UX Designer' },
  { value: 'other', label: 'Khác' },
]

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: '', label: 'Chọn mức kinh nghiệm' },
  { value: 'intern', label: 'Intern / Thực tập sinh' },
  { value: 'fresher', label: 'Fresher (0–6 tháng)' },
  { value: 'junior', label: 'Junior (6–12 tháng)' },
  { value: 'mid', label: 'Mid-level (1–3 năm)' },
  { value: 'senior', label: 'Senior (3+ năm)' },
]

export const EDUCATION_DEGREE_OPTIONS = [
  { value: '', label: 'Chọn trình độ' },
  { value: 'high_school', label: 'THPT' },
  { value: 'college', label: 'Cao đẳng' },
  { value: 'bachelor', label: 'Đại học (Cử nhân)' },
  { value: 'engineer', label: 'Đại học (Kỹ sư)' },
  { value: 'master', label: 'Thạc sĩ' },
  { value: 'phd', label: 'Tiến sĩ' },
  { value: 'other', label: 'Khác' },
]

export const TECH_STACK_OPTIONS: Record<string, string[]> = {
  Frontend: ['React', 'Next.js', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'HTML/CSS'],
  Backend: ['Node.js', 'NestJS', 'Express', 'Java', 'Spring Boot', 'Python', 'Django', 'FastAPI', 'Go', 'PHP', 'Laravel'],
  Mobile: ['React Native', 'Flutter', 'Swift', 'Kotlin'],
  Database: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Supabase', 'Firebase'],
  DevOps: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'CI/CD', 'Nginx'],
}

export const TECH_CATEGORIES = [
  { key: 'language' as const, label: 'Ngôn ngữ lập trình' },
  { key: 'framework' as const, label: 'Framework / Library' },
  { key: 'os' as const, label: 'Hệ điều hành' },
  { key: 'database' as const, label: 'Cơ sở dữ liệu' },
  { key: 'platform' as const, label: 'Platform / Cloud' },
  { key: 'devtool' as const, label: 'Dev Management Tools' },
] as const

export type TechCategory = (typeof TECH_CATEGORIES)[number]['key']

export const TECH_OPTIONS: Record<TechCategory, string[]> = {
  language: ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C', 'C++', 'C#', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart'],
  framework: ['React', 'Next.js', 'Vue.js', 'Nuxt.js', 'Angular', 'NestJS', 'Express', 'Fastify', 'Django', 'FastAPI', 'Flask', 'Spring Boot', 'Laravel', 'Flutter', 'React Native', 'Svelte'],
  os: ['Linux', 'Ubuntu', 'Debian', 'CentOS', 'macOS', 'Windows'],
  database: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Supabase', 'Firebase', 'DynamoDB', 'Elasticsearch'],
  platform: ['AWS', 'Google Cloud', 'Azure', 'Vercel', 'Netlify', 'Railway', 'Heroku', 'DigitalOcean', 'Docker', 'Kubernetes'],
  devtool: ['Git', 'GitHub', 'GitLab', 'Jira', 'Confluence', 'Notion', 'Slack', 'Jenkins', 'GitHub Actions', 'CircleCI', 'Trello'],
}

export const LANGUAGE_FRAMEWORK_MAP: Record<string, string[]> = {
  JavaScript: ['React', 'Next.js', 'Vue.js', 'Nuxt.js', 'Angular', 'Express', 'Fastify', 'NestJS', 'Svelte'],
  TypeScript: ['React', 'Next.js', 'Vue.js', 'Nuxt.js', 'Angular', 'NestJS', 'Express', 'Fastify'],
  Python: ['Django', 'FastAPI', 'Flask'],
  Java: ['Spring Boot'],
  PHP: ['Laravel'],
  Dart: ['Flutter'],
  Kotlin: ['React Native'],
}
