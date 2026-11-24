import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Center, Loader } from '@mantine/core'
import LoginClient from '@/components/auth/LoginClient'

export const metadata: Metadata = {
  title: 'Đăng nhập | InterviewCoach',
  description:
    'Đăng nhập vào InterviewCoach để tiếp tục luyện tập phỏng vấn cùng AI.',
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Center py="xl">
          <Loader color="brand" size="sm" />
        </Center>
      }
    >
      <LoginClient />
    </Suspense>
  )
}
