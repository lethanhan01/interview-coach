import RegisterForm from '@/components/auth/RegisterForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Đăng ký | InterviewCoach',
  description: 'Tạo tài khoản InterviewCoach để luyện tập phỏng vấn và nâng cao kỹ năng nghề nghiệp của bạn.',
}

export default function RegisterPage() {
  return (
    <main>
      <RegisterForm />
    </main>
  )
}
