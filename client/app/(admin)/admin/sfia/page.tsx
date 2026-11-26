import { Suspense } from 'react'
import { Skeleton } from '@mantine/core'
import type { Metadata } from 'next'
import { SfiaWorkspaceClient } from '@/components/sfia/SfiaWorkspaceClient'

export const metadata: Metadata = {
  title: 'Khung Năng Lực SFIA 9 — Quản trị',
  description:
    'Quản trị cây kỹ năng SFIA 9, ma trận 2D, 5 thuộc tính chung và độ phủ ngân hàng câu hỏi phỏng vấn.',
}

export default function SfiaAdminPage() {
  return (
    <Suspense fallback={<Skeleton height={360} radius="md" />}>
      <SfiaWorkspaceClient />
    </Suspense>
  )
}
