import type { Metadata } from 'next'
import ProfileClient from './_components/ProfileClient'

export const metadata: Metadata = {
  title: 'Cài đặt tài khoản | InterviewCoach',
  description:
    'Quản lý thông tin đăng nhập, hồ sơ cá nhân và bảo mật tài khoản ứng viên.',
}

export default function ProfilePage() {
  return <ProfileClient />
}
