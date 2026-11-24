import type { Metadata } from 'next'
import { Text } from '@mantine/core'
import { IconTool } from '@tabler/icons-react'
import { ErrorPageTemplate } from '@/components/common/status-pages/ErrorPageTemplate'

export const metadata: Metadata = {
  title: 'Hệ thống đang bảo trì — Interview Coach',
  description:
    'Interview Coach đang thực hiện bảo trì nâng cấp và sẽ sớm hoạt động trở lại.',
}

export default function MaintenancePage() {
  const eta = process.env.NEXT_PUBLIC_MAINTENANCE_ETA

  return (
    <ErrorPageTemplate
      icon={<IconTool size={32} stroke={1.5} aria-hidden="true" />}
      iconVariant="warning"
      title="Hệ thống đang bảo trì"
      description="Chúng tôi đang thực hiện nâng cấp để mang lại trải nghiệm tốt hơn cho bạn. Hệ thống sẽ sớm hoạt động trở lại."
      actions={[]}
    >
      {eta ? (
        <Text size="xs" c="dimmed" ta="center">
          Dự kiến hoàn thành:{' '}
          <Text span fw={600} c="neutral">
            {eta}
          </Text>
        </Text>
      ) : null}
    </ErrorPageTemplate>
  )
}
