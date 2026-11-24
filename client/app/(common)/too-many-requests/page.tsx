import type { Metadata } from 'next'
import { TooManyRequestsClient } from '@/components/common/status-pages/TooManyRequestsClient'

export const metadata: Metadata = {
  title: 'Quá nhiều yêu cầu (429) — Interview Coach',
  description:
    'Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng chờ hết thời gian đếm ngược rồi thử lại.',
}

export default function TooManyRequestsPage() {
  return <TooManyRequestsClient />
}
