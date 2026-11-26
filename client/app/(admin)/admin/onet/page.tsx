import type { Metadata } from 'next'
import { OnetWorkspaceClient } from '@/components/onet/OnetWorkspaceClient'

export const metadata: Metadata = {
  title: 'Trình duyệt O*NET',
  description:
    'Quản trị danh mục nghề nghiệp O*NET 29.1 và ánh xạ khung kỹ năng SFIA 9.',
}

export default function OnetAdminPage() {
  return <OnetWorkspaceClient />
}
