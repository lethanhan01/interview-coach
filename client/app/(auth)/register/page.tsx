import type { Metadata } from 'next'
import RegisterClient from '@/components/auth/register/RegisterClient'

export const metadata: Metadata = {
  title: 'Đăng ký',
  description:
    'Tạo tài khoản Intervia để luyện tập phỏng vấn và nâng cao kỹ năng nghề nghiệp của bạn.',
}

export default function RegisterPage() {
  return <RegisterClient />
}
