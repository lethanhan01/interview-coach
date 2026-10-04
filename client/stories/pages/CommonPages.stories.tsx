import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import React, { useState, useEffect } from 'react'
import {
  FileQuestion,
  AlertTriangle,
  RefreshCw,
  LockKeyhole,
  ShieldOff,
  Wrench,
  Rocket,
  WifiOff,
  Gauge,
  Home,
} from 'lucide-react'
import { ErrorPageTemplate } from '@/components/patterns/ErrorPageTemplate'

const meta: Meta = {
  title: 'Pages/Common',
  parameters: {
    layout: 'fullscreen',
  },
}
export default meta

type Story = StoryObj

// ─── 404 Not Found ──────────────────────────────────────────────────────────

export const NotFoundPage: Story = {
  name: '404 — Not Found',
  render: () => (
    <ErrorPageTemplate
      icon={<FileQuestion className="size-16" />}
      iconVariant="brand"
      statusCode={404}
      title="Không tìm thấy trang"
      description="Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển sang địa chỉ mới."
      actions={[
        {
          label: 'Trang chủ',
          href: '/',
          variant: 'primary',
          icon: <Home className="size-4" />,
        },
        { label: 'Phỏng vấn', href: '/sessions', variant: 'outline' },
      ]}
    />
  ),
}

// ─── 500 Internal Server Error ───────────────────────────────────────────────

export const InternalErrorPage: Story = {
  name: '500 — Internal Server Error',
  render: () => (
    <ErrorPageTemplate
      icon={<AlertTriangle className="size-16" />}
      iconVariant="danger"
      title="Đã xảy ra sự cố không mong muốn"
      description="Hệ thống gặp lỗi trong quá trình xử lý yêu cầu. Vui lòng nhấn nút thử lại bên dưới hoặc quay về trang chủ."
      errorDigest="abc123xyz"
      actions={[
        {
          label: 'Thử lại',
          onClick: () => alert('reset()'),
          variant: 'primary',
          icon: <RefreshCw className="size-4" />,
        },
        {
          label: 'Trang chủ',
          onClick: () => alert('→ /'),
          variant: 'outline',
        },
      ]}
    />
  ),
}

// ─── 401 Unauthenticated ─────────────────────────────────────────────────────

export const UnauthenticatedPage: Story = {
  name: '401 — Unauthenticated',
  render: () => (
    <ErrorPageTemplate
      icon={<LockKeyhole className="size-16" />}
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
          icon: <Home className="size-4" />,
        },
      ]}
    />
  ),
}

// ─── 403 Unauthorized ────────────────────────────────────────────────────────

export const UnauthorizedPage: Story = {
  name: '403 — Unauthorized',
  render: () => (
    <ErrorPageTemplate
      icon={<ShieldOff className="size-16" />}
      iconVariant="warning"
      statusCode={403}
      title="Bạn không có quyền truy cập"
      description="Tài khoản của bạn không có quyền xem trang này. Liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn."
      actions={[
        {
          label: 'Quay lại',
          onClick: () => alert('router.back()'),
          variant: 'outline',
        },
        { label: 'Trang chủ', href: '/', variant: 'primary' },
      ]}
    />
  ),
}

// ─── Maintenance ─────────────────────────────────────────────────────────────

export const MaintenancePage: Story = {
  name: 'Maintenance',
  render: () => (
    <ErrorPageTemplate
      icon={<Wrench className="size-16" />}
      iconVariant="warning"
      title="Hệ thống đang bảo trì"
      description="Chúng tôi đang thực hiện nâng cấp để mang lại trải nghiệm tốt hơn cho bạn. Hệ thống sẽ sớm hoạt động trở lại."
      actions={[]}
    >
      <p className="text-ink-faint mt-3 text-xs">
        Dự kiến hoàn thành:{' '}
        <span className="text-ink-muted font-medium">14:00 ngày 07/09/2026</span>
      </p>
    </ErrorPageTemplate>
  ),
}

// ─── Coming Soon ─────────────────────────────────────────────────────────────

export const ComingSoonPage: Story = {
  name: 'Coming Soon',
  render: () => (
    <ErrorPageTemplate
      icon={<Rocket className="size-16" />}
      iconVariant="brand"
      title="Tính năng sắp ra mắt"
      description="Chúng tôi đang phát triển tính năng này. Hãy quay lại sau để trải nghiệm nhé!"
      actions={[
        {
          label: 'Quay lại',
          onClick: () => alert('router.back()'),
          variant: 'outline',
        },
      ]}
    />
  ),
}

// ─── Network Offline ─────────────────────────────────────────────────────────

export const OfflineFallbackPage: Story = {
  name: 'Network Offline',
  render: () => (
    <ErrorPageTemplate
      icon={<WifiOff className="size-16" />}
      iconVariant="muted"
      title="Không có kết nối mạng"
      description="Vui lòng kiểm tra kết nối internet và thử lại."
      actions={[
        {
          label: 'Thử lại',
          onClick: () => alert('window.location.reload()'),
          variant: 'primary',
        },
      ]}
    />
  ),
}

// ─── 429 Too Many Requests (with live countdown) ─────────────────────────────

const STORY_RETRY_SECONDS = 10  // Shortened to 10s in Storybook for demo

function TooManyRequestsDemo() {
  const [remaining, setRemaining] = useState(STORY_RETRY_SECONDS)

  useEffect(() => {
    if (remaining <= 0) return
    const timer = setInterval(() => setRemaining((r) => r - 1), 1000)
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

// ─── All Icon Variants ────────────────────────────────────────────────────────

export const AllIconVariants: Story = {
  name: 'ErrorPageTemplate — All Icon Variants',
  render: () => (
    <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-2">
      {(['brand', 'danger', 'warning', 'muted'] as const).map((variant) => (
        <ErrorPageTemplate
          key={variant}
          icon={<AlertTriangle className="size-16" />}
          iconVariant={variant}
          title={`Variant: ${variant}`}
          description="Đây là preview của icon variant này trong ErrorPageTemplate."
          statusCode={variant === 'danger' ? 500 : undefined}
          actions={[
            { label: 'Primary', href: '#', variant: 'primary' },
            { label: 'Outline', href: '#', variant: 'outline' },
          ]}
        />
      ))}
    </div>
  ),
}
