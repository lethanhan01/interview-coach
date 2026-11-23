'use client'

import { IconRefresh, IconWifiOff } from '@tabler/icons-react'
import { ErrorPageTemplate } from '@/components/patterns/ErrorPageTemplate'

export function OfflineClient() {
  return (
    <ErrorPageTemplate
      icon={<IconWifiOff size={32} stroke={1.5} aria-hidden="true" />}
      iconVariant="neutral"
      title="Không có kết nối mạng"
      description="Vui lòng kiểm tra kết nối internet và thử lại."
      actions={[
        {
          label: 'Thử lại',
          onClick: () => window.location.reload(),
          variant: 'primary',
          icon: <IconRefresh size={16} stroke={1.5} aria-hidden="true" />,
        },
      ]}
    />
  )
}
