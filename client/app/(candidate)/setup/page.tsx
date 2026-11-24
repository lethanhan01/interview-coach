import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SetupWizardSkeleton } from '@/components/interview-setup/SetupStepPanels'
import SetupWizardClient from '@/components/interview-setup/SetupWizardClient'

export const metadata: Metadata = {
  title: 'Thiết lập phiên phỏng vấn | InterviewCoach',
  description:
    'Nhập hoặc chọn Job Description, cấu hình phong cách phỏng vấn và bắt đầu luyện tập với AI.',
}

export default function SetupPage() {
  return (
    <Suspense fallback={<SetupWizardSkeleton />}>
      <SetupWizardClient />
    </Suspense>
  )
}
