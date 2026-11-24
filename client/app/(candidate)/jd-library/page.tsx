import type { Metadata } from 'next'
import JdLibraryClient from './_components/JdLibraryClient'

export const metadata: Metadata = {
  title: 'Thư viện Job Description | InterviewCoach',
  description:
    'Quản lý và tái sử dụng các Job Description đã lưu cho phiên phỏng vấn AI.',
}

export default function JdLibraryPage() {
  return <JdLibraryClient />
}
