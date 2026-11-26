import type { Metadata } from 'next'
import { ReportClient } from '@/components/report/ReportClient'

export const metadata: Metadata = {
  title: 'Báo Cáo Đánh Giá Phỏng Vấn',
  description:
    'Báo cáo kết quả phỏng vấn toàn diện theo khung chuẩn SFIA 9 và O*NET.',
}

export default function ReportPage() {
  return <ReportClient />
}
