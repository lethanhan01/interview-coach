import type { Metadata } from 'next'
import SessionsClient from '@/components/sessions/SessionsClient'

export const metadata: Metadata = {
  title: 'Phiên phỏng vấn | InterviewCoach',
  description:
    'Theo dõi lịch sử phiên phỏng vấn AI, tiếp tục phiên đang chạy hoặc xem báo cáo đánh giá.',
}

export default function SessionsPage() {
  return <SessionsClient />
}
