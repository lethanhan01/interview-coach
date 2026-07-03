export {
  TECH_CATEGORIES,
  TECH_OPTIONS,
  TECH_STACK_OPTIONS,
} from '@/lib/interview-options'
export type { TechCategory } from '@/lib/interview-options'

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

export const LANGUAGE_FRAMEWORK_MAP: Record<string, string[]> = {
  JavaScript: ['React', 'Next.js', 'Vue.js', 'Nuxt.js', 'Angular', 'Express', 'Fastify', 'NestJS', 'Svelte'],
  TypeScript: ['React', 'Next.js', 'Vue.js', 'Nuxt.js', 'Angular', 'NestJS', 'Express', 'Fastify', 'Svelte'],
  Python: ['Django', 'FastAPI', 'Flask', 'Pandas', 'NumPy', 'scikit-learn', 'TensorFlow', 'PyTorch'],
  Java: ['Spring Boot'],
  'C#': ['ASP.NET Core', 'Unity'],
  PHP: ['Laravel'],
  Ruby: ['Ruby on Rails'],
  Dart: ['Flutter'],
  Kotlin: ['Jetpack Compose'],
  Swift: ['SwiftUI'],
  Rust: ['Axum'],
}
