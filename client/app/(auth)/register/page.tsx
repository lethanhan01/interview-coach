import type { Metadata } from 'next'
import RegisterClient from '@/components/auth/RegisterClient'

export const metadata: Metadata = {
  title: 'Đăng ký | InterviewCoach',
  description:
    'Tạo tài khoản InterviewCoach để luyện tập phỏng vấn và nâng cao kỹ năng nghề nghiệp của bạn.',
}

export default function RegisterPage() {
  return <RegisterClient />
}
