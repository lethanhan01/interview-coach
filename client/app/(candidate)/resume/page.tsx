import { Suspense } from 'react'
import type { Metadata } from 'next'
import ResumeClient from './_components/ResumeClient'
import { ResumeSkeleton } from './_components/ResumeSectionContent'

export const metadata: Metadata = {
  title: 'Hồ sơ CV & Kinh nghiệm | InterviewCoach',
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
