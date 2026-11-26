import type { Metadata } from 'next'
import ResetPasswordClient from '@/components/auth/reset-password/ResetPasswordClient'

export const metadata: Metadata = {
  title: 'Đặt lại mật khẩu',
  description:
    'Khôi phục quyền truy cập tài khoản Intervia bằng mã xác thực qua email.',
}

export default function ResetPasswordPage() {
  return <ResetPasswordClient />
}
