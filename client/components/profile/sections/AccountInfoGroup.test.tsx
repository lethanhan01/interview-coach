import { describe, expect, it } from 'vitest'
import { render, screen } from '@test-utils'
import AccountInfoGroup from './AccountInfoGroup'

describe('AccountInfoGroup', () => {
  it('renders email, candidate role, active status, and formatted Vietnam createdAt', () => {
    render(
      <AccountInfoGroup
        email="candidate@example.com"
        role="candidate"
        status="active"
        createdAt="2026-05-10T08:30:00.000Z"
      />
    )

    expect(screen.getByText('candidate@example.com')).toBeInTheDocument()
    expect(screen.getByText('Ứng viên')).toBeInTheDocument()
    expect(screen.getByText('Đang hoạt động')).toBeInTheDocument()
    expect(screen.getByText(/10\/05\/2026/)).toBeInTheDocument()
  })

  it('renders all 4 AccountStatus labels and admin role correctly', () => {
    const { rerender } = render(
      <AccountInfoGroup
        email="admin@example.com"
        role="admin"
        status="password_reset_required"
      />
    )
    expect(screen.getByText('Quản trị viên')).toBeInTheDocument()
    expect(screen.getByText('Cần đặt lại mật khẩu')).toBeInTheDocument()
    expect(screen.getByText('Chưa cập nhật')).toBeInTheDocument()

    rerender(
      <AccountInfoGroup
        email="locked@example.com"
        role="candidate"
        status="locked"
      />
    )
    expect(screen.getByText('Tạm khóa')).toBeInTheDocument()

    rerender(
      <AccountInfoGroup
        email="deleted@example.com"
        role="candidate"
        status="deleted"
      />
    )
    expect(screen.getByText('Đã xóa')).toBeInTheDocument()
  })
})
