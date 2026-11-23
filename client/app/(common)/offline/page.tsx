import type { Metadata } from 'next'
import { OfflineClient } from './_components/OfflineClient'

export const metadata: Metadata = {
  title: 'Không có kết nối mạng — Interview Coach',
  description:
    'Vui lòng kiểm tra kết nối internet của bạn để tiếp tục sử dụng Interview Coach.',
}

export default function OfflinePage() {
  return <OfflineClient />
}
