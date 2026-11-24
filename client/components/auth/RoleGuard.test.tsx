import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Text } from '@mantine/core'
import { render, screen, waitFor } from '@test-utils'
import RoleGuard from './RoleGuard'

const mockReplace = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}))

describe('RoleGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders status loader while auth state is loading', () => {
    mockUseAuth.mockReturnValue({ role: null, isLoading: true })

    render(
      <RoleGuard allowedRole="candidate" fallbackRoute="/admin/dashboard">
        <Text>Protected content</Text>
      </RoleGuard>
    )

    expect(
      screen.getByRole('status', { name: 'Đang kiểm tra quyền truy cập' })
    ).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('redirects to /login?reason=session_expired when unauthenticated', async () => {
    mockUseAuth.mockReturnValue({ role: null, isLoading: false })

    render(
      <RoleGuard allowedRole="candidate" fallbackRoute="/admin/dashboard">
        <Text>Protected content</Text>
      </RoleGuard>
    )

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login?reason=session_expired')
    })
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('redirects to fallbackRoute when role does not match allowedRole', async () => {
    mockUseAuth.mockReturnValue({ role: 'admin', isLoading: false })

    render(
      <RoleGuard allowedRole="candidate" fallbackRoute="/admin/dashboard">
        <Text>Protected content</Text>
      </RoleGuard>
    )

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/admin/dashboard')
    })
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('renders children when authenticated role matches allowedRole', () => {
    mockUseAuth.mockReturnValue({ role: 'candidate', isLoading: false })

    render(
      <RoleGuard allowedRole="candidate" fallbackRoute="/admin/dashboard">
        <Text>Protected content</Text>
      </RoleGuard>
    )

    expect(screen.getByText('Protected content')).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })
})
