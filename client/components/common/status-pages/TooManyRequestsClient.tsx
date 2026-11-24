'use client'

import { useEffect, useState } from 'react'
import { useInterval } from '@mantine/hooks'
import { IconGauge, IconRefresh } from '@tabler/icons-react'
import { ErrorPageTemplate } from './ErrorPageTemplate'

const DEFAULT_RETRY_SECONDS = 60

export interface TooManyRequestsClientProps {
  initialSeconds?: number
  onRetry?: () => void
}

export function TooManyRequestsClient({
  initialSeconds = DEFAULT_RETRY_SECONDS,
  onRetry,
}: Readonly<TooManyRequestsClientProps>) {
  const [remaining, setRemaining] = useState(initialSeconds)
  const { stop } = useInterval(
    () => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    },
    1000,
    { autoInvoke: initialSeconds > 0 }
  )

  useEffect(() => {
    if (remaining <= 0) {
      stop()
    }
  }, [remaining, stop])

  const isDisabled = remaining > 0

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
      return
    }
    window.location.reload()
  }

  return (
    <ErrorPageTemplate
      icon={<IconGauge size={32} stroke={1.5} aria-hidden="true" />}
      iconVariant="warning"
      statusCode={429}
      title="Quá nhiều yêu cầu"
      description="Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng chờ và thử lại sau."
      actions={[
        {
          label: isDisabled ? `Thử lại sau ${remaining}s` : 'Thử lại ngay',
          onClick: handleRetry,
          variant: 'primary',
          disabled: isDisabled,
          icon: <IconRefresh size={16} stroke={1.5} aria-hidden="true" />,
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
