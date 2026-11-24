import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SetupWizardSkeleton } from './_components/SetupStepPanels'
import SetupWizardClient from './_components/SetupWizardClient'

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
