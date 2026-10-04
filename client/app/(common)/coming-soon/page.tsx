'use client'

import { useRouter } from 'next/navigation'
import { Rocket } from 'lucide-react'
import { ErrorPageTemplate } from '@/components/patterns/ErrorPageTemplate'

/**
 * /coming-soon — Coming Soon Page
 *
 * Used for features that are under development.
 * Navigate users here from disabled nav links or beta feature gates.
 */
export default function ComingSoonPage() {
  const router = useRouter()

  return (
    <ErrorPageTemplate
      icon={<Rocket className="size-16" />}
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
