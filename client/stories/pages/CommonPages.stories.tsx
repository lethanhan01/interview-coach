import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useEffect, useState } from 'react'
import { SimpleGrid, Text } from '@mantine/core'
import { useInterval } from '@mantine/hooks'
import {
  IconAlertTriangle,
  IconError404,
  IconGauge,
  IconHome,
  IconLock,
  IconRefresh,
  IconRocket,
  IconShieldOff,
  IconTool,
  IconWifiOff,
} from '@tabler/icons-react'
import {
  ErrorPageTemplate,
  type ErrorPageIconVariant,
} from '@/components/common/status-pages/ErrorPageTemplate'

const meta: Meta = {
  title: 'Pages/Common',
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
}

export default meta

type Story = StoryObj

export const NotFoundPage: Story = {
  name: '404 — Not Found',
  render: () => (
    <ErrorPageTemplate
      icon={<IconError404 size={32} stroke={1.5} aria-hidden="true" />}
      iconVariant="brand"
      statusCode={404}
      title="Không tìm thấy trang"
      description="Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển sang địa chỉ mới."
      actions={[
        {
          label: 'Trang chủ',
          href: '/',
          variant: 'primary',
          icon: <IconHome size={16} stroke={1.5} aria-hidden="true" />,
        },
        { label: 'Phỏng vấn', href: '/sessions', variant: 'outline' },
      ]}
    />
  ),
}

export const InternalErrorPage: Story = {
  name: '500 — Internal Server Error',
  render: () => (
    <ErrorPageTemplate
      icon={<IconAlertTriangle size={32} stroke={1.5} aria-hidden="true" />}
      iconVariant="danger"
      title="Đã xảy ra sự cố không mong muốn"
      description="Hệ thống gặp lỗi trong quá trình xử lý yêu cầu. Vui lòng nhấn nút thử lại bên dưới hoặc quay về trang chủ."
      errorDigest="abc123xyz"
      actions={[
        {
          label: 'Thử lại',
          onClick: () => {},
          variant: 'primary',
          icon: <IconRefresh size={16} stroke={1.5} aria-hidden="true" />,
        },
        {
          label: 'Trang chủ',
          href: '/',
          variant: 'outline',
        },
      ]}
    />
  ),
}

export const UnauthenticatedPage: Story = {
  name: '401 — Unauthenticated',
  render: () => (
    <ErrorPageTemplate
      icon={<IconLock size={32} stroke={1.5} aria-hidden="true" />}
      iconVariant="brand"
      statusCode={401}
      title="Bạn chưa đăng nhập"
      description="Vui lòng đăng nhập để tiếp tục truy cập tính năng này."
      actions={[
        {
          label: 'Đăng nhập',
          href: '/login?next=%2Fsessions',
          variant: 'primary',
        },
        {
          label: 'Trang chủ',
          href: '/',
          variant: 'outline',
          icon: <IconHome size={16} stroke={1.5} aria-hidden="true" />,
        },
      ]}
    />
  ),
}

export const UnauthorizedPage: Story = {
  name: '403 — Unauthorized',
  render: () => (
    <ErrorPageTemplate
      icon={<IconShieldOff size={32} stroke={1.5} aria-hidden="true" />}
      iconVariant="warning"
      statusCode={403}
      title="Bạn không có quyền truy cập"
      description="Tài khoản của bạn không có quyền xem trang này. Liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn."
      actions={[
        {
          label: 'Quay lại',
          onClick: () => {},
          variant: 'outline',
        },
        { label: 'Trang chủ', href: '/', variant: 'primary' },
      ]}
    />
  ),
}

export const MaintenancePage: Story = {
  name: 'Maintenance',
  render: () => (
    <ErrorPageTemplate
      icon={<IconTool size={32} stroke={1.5} aria-hidden="true" />}
      iconVariant="warning"
      title="Hệ thống đang bảo trì"
      description="Chúng tôi đang thực hiện nâng cấp để mang lại trải nghiệm tốt hơn cho bạn. Hệ thống sẽ sớm hoạt động trở lại."
      actions={[]}
    >
      <Text size="xs" c="dimmed">
        Dự kiến hoàn thành:{' '}
        <Text span fw={600} c="neutral">
          14:00 ngày 07/09/2026
        </Text>
      </Text>
    </ErrorPageTemplate>
  ),
}

export const ComingSoonPage: Story = {
  name: 'Coming Soon',
  render: () => (
    <ErrorPageTemplate
      icon={<IconRocket size={32} stroke={1.5} aria-hidden="true" />}
      iconVariant="brand"
      title="Tính năng sắp ra mắt"
      description="Chúng tôi đang phát triển tính năng này. Hãy quay lại sau để trải nghiệm nhé!"
      actions={[
        {
          label: 'Quay lại',
          onClick: () => {},
          variant: 'outline',
        },
      ]}
    />
  ),
}

export const OfflineFallbackPage: Story = {
  name: 'Network Offline',
  render: () => (
    <ErrorPageTemplate
      icon={<IconWifiOff size={32} stroke={1.5} aria-hidden="true" />}
      iconVariant="neutral"
      title="Không có kết nối mạng"
      description="Vui lòng kiểm tra kết nối internet và thử lại."
      actions={[
        {
          label: 'Thử lại',
          onClick: () => {},
          variant: 'primary',
        },
      ]}
    />
  ),
}

const STORY_RETRY_SECONDS = 10

function TooManyRequestsDemo() {
  const [remaining, setRemaining] = useState(STORY_RETRY_SECONDS)
  const interval = useInterval(
    () => setRemaining((prev) => (prev > 0 ? prev - 1 : 0)),
    1000
  )

  useEffect(() => {
    if (remaining > 0) {
      interval.start()
    } else {
      interval.stop()
    }
    return interval.stop
  }, [remaining, interval])

  const isDisabled = remaining > 0

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
          onClick: () => setRemaining(STORY_RETRY_SECONDS),
          variant: 'primary',
          disabled: isDisabled,
        },
        { label: 'Trang chủ', href: '/', variant: 'outline' },
      ]}
    />
  )
}

export const TooManyRequestsPage: Story = {
  name: '429 — Too Many Requests (with countdown)',
  render: () => <TooManyRequestsDemo />,
}

const SEMANTIC_VARIANTS: ErrorPageIconVariant[] = [
  'brand',
  'success',
  'warning',
  'danger',
  'neutral',
]

export const AllIconVariants: Story = {
  name: 'ErrorPageTemplate — All Semantic Variants',
  render: () => (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" p="lg">
      {SEMANTIC_VARIANTS.map((variant) => (
        <ErrorPageTemplate
          key={variant}
          icon={<IconAlertTriangle size={32} stroke={1.5} aria-hidden="true" />}
          iconVariant={variant}
          title={`Variant: ${variant}`}
          description="Đây là preview của icon variant ngữ nghĩa trong ErrorPageTemplate."
          statusCode={variant === 'danger' ? 500 : undefined}
          actions={[
            { label: 'Primary', href: '#', variant: 'primary' },
            { label: 'Outline', href: '#', variant: 'outline' },
          ]}
        />
      ))}
    </SimpleGrid>
  ),
}
