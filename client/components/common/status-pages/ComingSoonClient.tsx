'use client'

import { useRouter } from 'next/navigation'
import { IconRocket } from '@tabler/icons-react'
import { ErrorPageTemplate } from './ErrorPageTemplate'

export function ComingSoonClient() {
  const router = useRouter()

  return (
    <ErrorPageTemplate
      icon={<IconRocket size={32} stroke={1.5} aria-hidden="true" />}
      iconVariant="brand"
      title="Tính năng sắp ra mắt"
      description="Chúng tôi đang phát triển tính năng này. Hãy quay lại sau để trải nghiệm nhé!"
      actions={[
        {
          label: 'Quay lại',
          onClick: () => router.back(),
          variant: 'outline',
        },
      ]}
    />
  )
}
