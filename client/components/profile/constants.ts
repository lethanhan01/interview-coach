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
