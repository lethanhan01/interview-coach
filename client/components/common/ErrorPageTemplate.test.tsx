import { Text } from '@mantine/core'
import { IconAlertTriangle, IconHome } from '@tabler/icons-react'
import { render, screen, userEvent } from '@test-utils'
import { axe } from 'jest-axe'
import { vi } from 'vitest'
import {
  ErrorPageTemplate,
  type ErrorPageIconVariant,
} from './ErrorPageTemplate'

describe('ErrorPageTemplate', () => {
  it('renders status code, heading, description, digest, children, and actions', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(
      <ErrorPageTemplate
        icon={<IconAlertTriangle size={32} stroke={1.5} aria-hidden="true" />}
        iconVariant="danger"
        statusCode={500}
        title="Đã xảy ra sự cố"
        description="Hệ thống gặp lỗi khi xử lý yêu cầu."
        errorDigest="digest-xyz"
        actions={[
          { label: 'Thử lại', onClick: onRetry, variant: 'primary' },
          {
            label: 'Trang chủ',
            href: '/',
            variant: 'outline',
            icon: <IconHome size={16} stroke={1.5} aria-hidden="true" />,
          },
          { label: 'Đang chờ', disabled: true, variant: 'ghost' },
        ]}
      >
        <Text size="xs" c="dimmed">
          Nội dung bổ sung
        </Text>
      </ErrorPageTemplate>
    )

    expect(screen.getByText('500')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Đã xảy ra sự cố' })
    ).toBeInTheDocument()
    expect(screen.getByText('Mã lỗi: digest-xyz')).toBeInTheDocument()
    expect(screen.getByText('Nội dung bổ sung')).toBeInTheDocument()

    const homeLink = screen.getByRole('link', { name: 'Trang chủ' })
    expect(homeLink).toHaveAttribute('href', '/')

    expect(screen.getByRole('button', { name: 'Đang chờ' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it.each<ErrorPageIconVariant>([
    'brand',
    'success',
    'warning',
    'danger',
    'neutral',
  ])('renders cleanly with semantic variant "%s"', async (variant) => {
    const { container } = render(
      <ErrorPageTemplate
        icon={<IconAlertTriangle size={32} stroke={1.5} aria-hidden="true" />}
        iconVariant={variant}
        title={`Variant ${variant}`}
        description="Mô tả trạng thái."
      />
    )

    expect(
      screen.getByRole('heading', { level: 1, name: `Variant ${variant}` })
    ).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
