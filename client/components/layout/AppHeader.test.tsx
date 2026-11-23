import { AppShell } from '@mantine/core'
import { render, screen, userEvent, within } from '@test-utils'
import { axe } from 'jest-axe'
import { vi } from 'vitest'
import AppHeader from './AppHeader'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u-1', email: 'admin@interviewcoach.vn' },
    role: 'admin',
    status: 'active',
    isLoading: false,
    refresh: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
  }),
}))

describe('AppHeader', () => {
  it('renders header controls, mobile menu trigger, color scheme toggle, and user menu', async () => {
    const user = userEvent.setup()
    const onToggleMobile = vi.fn()

    render(
      <AppShell header={{ height: 60 }}>
        <AppShell.Header>
          <AppHeader
            role="admin"
            mobileOpened={false}
            onToggleMobile={onToggleMobile}
          />
        </AppShell.Header>
      </AppShell>
    )

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Chuyển đổi chế độ sáng tối' })
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mở menu điều hướng' }))
    expect(onToggleMobile).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Menu tài khoản' }))
    const body = within(document.body)
    expect(await body.findByText('Hồ sơ Admin')).toBeInTheDocument()
    expect(
      body.getByRole('menuitem', { name: 'Đăng xuất' })
    ).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <AppShell header={{ height: 60 }}>
        <AppShell.Header>
          <AppHeader role="candidate" />
        </AppShell.Header>
      </AppShell>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
