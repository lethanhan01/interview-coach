'use client'

import { useState, useEffect } from 'react'
import { Gauge } from 'lucide-react'
import { ErrorPageTemplate } from '@/components/patterns/ErrorPageTemplate'

const RETRY_SECONDS = 60

/**
 * /too-many-requests — 429 Rate Limit Page
 *
 * Shown when the API returns 429 Too Many Requests.
 * Features a 60-second countdown timer that disables the retry button
 * while the user waits, then re-enables it when the cooldown expires.
 *
 * Client-side countdown is implemented with useState + setInterval.
 */
export default function TooManyRequestsPage() {
  const [remaining, setRemaining] = useState(RETRY_SECONDS)

  useEffect(() => {
    if (remaining <= 0) return

    const timer = setInterval(() => {
      setRemaining((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [remaining])

  const isDisabled = remaining > 0

  return (
    <ErrorPageTemplate
      icon={<Gauge className="size-16" />}
      iconVariant="warning"
      statusCode={429}
      title="Quá nhiều yêu cầu"
      description="Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng chờ và thử lại sau."
      actions={[
        {
          label: isDisabled ? `Thử lại sau ${remaining}s` : 'Thử lại ngay',
          onClick: () => window.location.reload(),
          variant: 'primary',
          disabled: isDisabled,
        },
        {
          label: 'Trang chủ',
          href: '/',
          variant: 'outline',
        },
      ]}
    />
  )
}
