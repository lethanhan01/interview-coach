import { Suspense } from 'react'
import type { Metadata } from 'next'
import ResumeClient from '@/components/resume/ResumeClient'
import { ResumeSkeleton } from '@/components/resume/ResumeSectionContent'

export const metadata: Metadata = {
  title: 'Hồ sơ CV & Kinh nghiệm',
  description:
    'Quản lý định hướng nghề nghiệp, kỹ năng chuyên môn, kinh nghiệm làm việc, dự án và chứng chỉ.',
}

export default function ResumePage() {
  return (
    <Suspense fallback={<ResumeSkeleton />}>
      <ResumeClient />
    </Suspense>
  )
}
