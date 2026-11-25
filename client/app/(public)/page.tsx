import type { Metadata } from 'next'
import { CtaSection } from '@/components/landing/sections/CtaSection'
import { FeaturesSection } from '@/components/landing/sections/FeaturesSection'
import { HeroSection } from '@/components/landing/sections/HeroSection'
import { WorkflowSection } from '@/components/landing/sections/WorkflowSection'

export const metadata: Metadata = {
  title: {
    absolute: 'Intervia — Luyện phỏng vấn AI chuẩn STAR & SFIA 9',
  },
  description:
    'Intervia — Nền tảng luyện phỏng vấn AI dành cho sinh viên CNTT Việt Nam: bám sát Job Description, đặt câu hỏi follow-up thông minh và chấm điểm chi tiết theo STAR & SFIA 9.',
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <WorkflowSection />
      <FeaturesSection />
      <CtaSection />
    </>
  )
}
