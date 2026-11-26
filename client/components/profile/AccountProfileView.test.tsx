import { describe, expect, it, vi } from 'vitest'
import { axe } from 'jest-axe'
import { render, screen, userEvent } from '@test-utils'
import type { UserAccountResponse } from '@/types'
import { AccountProfileView } from './AccountProfileView'

const mockUserAccount: UserAccountResponse = {
  id: 'user-1',
  email: 'an.nguyen@example.com',
  firstname: 'An',
  lastname: 'Nguyễn',
  role: 'candidate',
  status: 'active',
  createdAt: '2026-04-01T10:00:00.000Z',
}

describe('AccountProfileView', () => {
  it('renders loading skeleton with accessible status text', () => {
    render(
      <AccountProfileView
        variant="candidate"
        title="Cài đặt tài khoản"
        subtitle="Quản lý thông tin"
        data={null}
        loading
        error={null}
        onSavePersonalInfo={vi.fn()}
      />
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Đang tải thông tin tài khoản...'
    )
  })

  it('renders error alert with retry button when loading fails', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(
      <AccountProfileView
        variant="candidate"
        title="Cài đặt tài khoản"
        subtitle="Quản lý thông tin"
        data={null}
        loading={false}
        error="Lỗi kết nối máy chủ"
        onRetry={onRetry}
        onSavePersonalInfo={vi.fn()}
      />
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Lỗi kết nối máy chủ')
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders candidate profile with /resume link, switches tabs, and passes a11y checks', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <AccountProfileView
        variant="candidate"
        title="Cài đặt tài khoản"
        subtitle="Quản lý thông tin đăng nhập"
        data={mockUserAccount}
        loading={false}
        error={null}
        onSavePersonalInfo={vi.fn()}
      />
    )

    expect(
      screen.getByRole('heading', { name: 'Cài đặt tài khoản' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Nguyễn An' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Xem hồ sơ CV/i })).toHaveAttribute(
      'href',
      '/resume'
    )
    expect(screen.getByText('Thông tin cá nhân')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()

    await user.click(screen.getByRole('tab', { name: /Bảo mật/i }))
    expect(screen.getByText('Đổi mật khẩu & Bảo mật')).toBeInTheDocument()
  })

  it('renders admin profile header with full-access badge', () => {
    render(
      <AccountProfileView
        variant="admin"
        title="Hồ sơ Quản trị viên"
        subtitle="Quản lý tài khoản quản trị"
        data={{ ...mockUserAccount, role: 'admin' }}
        loading={false}
        error={null}
        onSavePersonalInfo={vi.fn()}
      />
    )

    expect(
      screen.getByRole('heading', { name: 'Hồ sơ Quản trị viên' })
    ).toBeInTheDocument()
    expect(screen.getByText('Toàn quyền hệ thống')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Xem hồ sơ CV/i })
    ).not.toBeInTheDocument()
  })
})
