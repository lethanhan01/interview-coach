'use client'

import { WifiOff } from 'lucide-react'
import { ErrorPageTemplate } from '@/components/patterns/ErrorPageTemplate'

/**
 * /offline — Network Offline Fallback Page
 *
 * This is a static fallback page for when the user navigates here directly.
 * In practice, users will see the OfflineBanner overlay (mounted in app/layout.tsx)
 * which appears automatically when navigator.onLine is false — without any navigation.
 *
 * This page exists as a physical fallback for edge cases (e.g., PWA offline shell).
 */
export default function OfflinePage() {
  return (
    <ErrorPageTemplate
      icon={<WifiOff className="size-16" />}
      iconVariant="muted"
      title="Không có kết nối mạng"
      description="Vui lòng kiểm tra kết nối internet và thử lại."
      actions={[
        {
          label: 'Thử lại',
          onClick: () => window.location.reload(),
          variant: 'primary',
        },
      ]}
    />
  )
}
