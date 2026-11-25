import type { Metadata } from 'next'
import { OfflineClient } from '@/components/common/status-pages/OfflineClient'

export const metadata: Metadata = {
  title: 'Không có kết nối mạng',
  description:
    'Vui lòng kiểm tra kết nối internet của bạn để tiếp tục sử dụng Intervia.',
}

export default function OfflinePage() {
  return <OfflineClient />
}
