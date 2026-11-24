import type { Metadata } from 'next'
import SessionRoomClient from '@/components/interview/SessionRoomClient'

export const metadata: Metadata = {
  title: 'Phòng phỏng vấn | InterviewCoach',
  description:
    'Tham gia phiên phỏng vấn trực tiếp với AI qua văn bản hoặc giọng nói cùng bộ đếm thời gian thực.',
}

export default function InterviewPage() {
  return <SessionRoomClient />
}
