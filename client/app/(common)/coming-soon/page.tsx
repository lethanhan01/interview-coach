import type { Metadata } from 'next'
import { ComingSoonClient } from '@/components/common/status-pages/ComingSoonClient'

export const metadata: Metadata = {
  title: 'Tính năng sắp ra mắt',
  description:
    'Tính năng này đang được phát triển và sẽ sớm ra mắt trên Intervia.',
}

export default function ComingSoonPage() {
  return <ComingSoonClient />
}
