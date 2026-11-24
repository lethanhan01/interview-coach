import { Text } from '@mantine/core'
import { render, screen, userEvent } from '@test-utils'
import { axe } from 'jest-axe'
import { usePathname } from 'next/navigation'
import { vi } from 'vitest'
import AppLayout from './AppLayout'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/admin/dashboard'),
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'u-1', email: 'admin@interviewcoach.vn' },
    role: 'admin',
    status: 'active',
    isLoading: false,
    refresh: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
  }),
}))

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePathname).mockReturnValue('/admin/dashboard')
  })

  it('renders banner, navigation, main landmarks and children for admin role', () => {
    render(
      <AppLayout role="admin">
        <Text>Admin Content Here</Text>
      </AppLayout>
    )

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Điều hướng chính' })
    ).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByText('Admin Content Here')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'O*NET Browser' })
    ).toBeInTheDocument()
  })

  it('toggles desktop sidebar collapse rail cleanly', async () => {
    const user = userEvent.setup()
    render(
      <AppLayout role="candidate">
        <Text>Candidate Content</Text>
      </AppLayout>
    )

    await user.click(
      screen.getByRole('button', { name: 'Thu gọn thanh điều hướng' })
    )
    expect(
      screen.getByRole('button', { name: 'Mở rộng thanh điều hướng' })
    ).toBeInTheDocument()
  })

  it('activates workspace mode automatically on /admin/onet', () => {
    vi.mocked(usePathname).mockReturnValue('/admin/onet')
    render(
      <AppLayout role="admin">
        <Text>Workspace Pane</Text>
      </AppLayout>
    )

    expect(screen.getByRole('main')).toHaveAttribute('data-workspace', 'true')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <AppLayout role="candidate">
        <Text>Accessible Main Content</Text>
      </AppLayout>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
