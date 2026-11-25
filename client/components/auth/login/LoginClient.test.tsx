import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'jest-axe'
import {
  createTestQueryClient,
  render,
  screen,
  userEvent,
  waitFor,
} from '@test-utils'
import { queryKeys } from '@/queries/keys'
import { authService } from '@/services/auth.service'
import type { AuthUser } from '@/types'
import LoginClient from './LoginClient'

const mockReplace = vi.fn()
let currentSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => currentSearchParams,
}))

vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
  },
}))

const mockCandidate: AuthUser = {
  id: 'u-1',
  email: 'candidate@example.com',
  role: 'candidate',
  status: 'active',
  firstname: 'An',
  lastname: 'Nguyễn',
  emailVerified: true,
}

const mockAdmin: AuthUser = {
  id: 'a-1',
  email: 'admin@example.com',
  role: 'admin',
  status: 'active',
  firstname: 'Admin',
  lastname: 'System',
  emailVerified: true,
}

describe('LoginClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentSearchParams = new URLSearchParams()
  })

  it('logs in candidate, updates auth.me cache, clears stale non-auth cache, and redirects to /sessions', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    queryClient.setDefaultOptions({
      queries: { retry: false, staleTime: 30_000, gcTime: 60_000 },
    })
    queryClient.setQueryData(['sessions', 'list'], [{ id: 'old-session' }])
    vi.mocked(authService.login).mockResolvedValueOnce(mockCandidate)

    render(<LoginClient />, { queryClient })

    await user.type(
      screen.getByPlaceholderText('Nhập email'),
      'candidate@example.com'
    )
    await user.type(
      screen.getByPlaceholderText('Nhập mật khẩu'),
      'StrongPass123!'
    )
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/sessions')
    })

    expect(queryClient.getQueryData(queryKeys.auth.me())).toEqual(mockCandidate)
    expect(queryClient.getQueryData(['sessions', 'list'])).toBeUndefined()
  })

  it('redirects admin to /admin/dashboard when no ?next param is provided', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.login).mockResolvedValueOnce(mockAdmin)

    render(<LoginClient />)

    await user.type(
      screen.getByPlaceholderText('Nhập email'),
      'admin@example.com'
    )
    await user.type(
      screen.getByPlaceholderText('Nhập mật khẩu'),
      'AdminPass123!'
    )
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/admin/dashboard')
    })
  })

  it('honors safe internal ?next and rejects unsafe external ?next', async () => {
    const user = userEvent.setup()
    currentSearchParams = new URLSearchParams('next=/setup?jdId=99')
    vi.mocked(authService.login).mockResolvedValueOnce(mockCandidate)

    const { unmount } = render(<LoginClient />)

    await user.type(
      screen.getByPlaceholderText('Nhập email'),
      'candidate@example.com'
    )
    await user.type(
      screen.getByPlaceholderText('Nhập mật khẩu'),
      'StrongPass123!'
    )
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/setup?jdId=99')
    })

    unmount()
    mockReplace.mockClear()
    currentSearchParams = new URLSearchParams('next=https://evil.com')
    vi.mocked(authService.login).mockResolvedValueOnce(mockCandidate)

    render(<LoginClient />)

    await user.type(
      screen.getByPlaceholderText('Nhập email'),
      'candidate@example.com'
    )
    await user.type(
      screen.getByPlaceholderText('Nhập mật khẩu'),
      'StrongPass123!'
    )
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/sessions')
    })
  })

  it('shows inactive account banner and session expired notice from query params', async () => {
    currentSearchParams = new URLSearchParams('error=account_inactive')
    const { container, rerender } = render(<LoginClient />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Tài khoản của bạn đã bị khóa hoặc xóa'
    )
    expect(await axe(container)).toHaveNoViolations()

    currentSearchParams = new URLSearchParams('reason=session_expired')
    rerender(<LoginClient />)
    expect(screen.getByRole('status')).toHaveTextContent(
      'Phiên đăng nhập đã hết hạn'
    )
  })
})
