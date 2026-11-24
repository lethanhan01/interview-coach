import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'jest-axe'
import {
  createTestQueryClient,
  render,
  screen,
  userEvent,
  waitFor,
} from '@test-utils'
import { ApiClientError } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-client'
import { authService } from '@/services/auth.service'
import type { AuthUser } from '@/types'
import ResetPasswordClient from './ResetPasswordClient'

const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

vi.mock('@/services/auth.service', () => ({
  authService: {
    requestPasswordReset: vi.fn(),
    confirmPasswordReset: vi.fn(),
  },
}))

const mockCandidateUser: AuthUser = {
  id: 'u-1',
  email: 'user@example.com',
  role: 'candidate',
  status: 'active',
  firstname: 'An',
  lastname: 'Nguyễn',
  emailVerified: true,
}

const mockAdminUser: AuthUser = {
  id: 'a-1',
  email: 'admin@example.com',
  role: 'admin',
  status: 'active',
  firstname: 'Admin',
  lastname: 'User',
  emailVerified: true,
}

async function advanceToStepTwo(
  user: ReturnType<typeof userEvent.setup>,
  email = 'user@example.com'
) {
  vi.mocked(authService.requestPasswordReset).mockResolvedValueOnce(undefined)
  await user.type(screen.getByLabelText(/Địa chỉ Email/i), email)
  await user.click(screen.getByRole('button', { name: 'Gửi mã xác thực' }))
  await screen.findByText('Email nhận mã')
}

async function typePinCode(
  user: ReturnType<typeof userEvent.setup>,
  code: string
) {
  const pinInputs = screen.getAllByLabelText('Mã xác thực 6 số')
  for (let i = 0; i < code.length; i += 1) {
    await user.type(pinInputs[i], code[i])
  }
}

describe('ResetPasswordClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates step 1 email and passes accessibility check', async () => {
    const user = userEvent.setup()
    const { container } = render(<ResetPasswordClient />)

    expect(
      screen.getByRole('heading', { name: 'Quên mật khẩu?' })
    ).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()

    await user.click(screen.getByRole('button', { name: 'Gửi mã xác thực' }))
    expect(await screen.findByText('Email là bắt buộc')).toBeInTheDocument()
    expect(authService.requestPasswordReset).not.toHaveBeenCalled()
  })

  it('completes step 1 -> step 2 auto-login for candidate, updates auth.me cache, and redirects to /sessions', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    queryClient.setDefaultOptions({
      queries: { retry: false, staleTime: 30_000, gcTime: 60_000 },
    })
    queryClient.setQueryData(['sessions', 'list'], [{ id: 'stale' }])
    vi.mocked(authService.confirmPasswordReset).mockResolvedValueOnce(
      mockCandidateUser
    )

    const { container } = render(<ResetPasswordClient />, { queryClient })
    await advanceToStepTwo(user)

    expect(screen.getByText('user@example.com')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()

    await typePinCode(user, '123456')
    await user.type(
      screen.getByPlaceholderText('Ít nhất 12 ký tự'),
      'NewStrongPass123!'
    )
    await user.type(
      screen.getByPlaceholderText('Nhập lại mật khẩu mới'),
      'NewStrongPass123!'
    )
    await user.click(
      screen.getByRole('button', { name: 'Xác nhận đổi mật khẩu' })
    )

    await waitFor(() => {
      expect(authService.confirmPasswordReset).toHaveBeenCalledWith({
        email: 'user@example.com',
        code: '123456',
        newPassword: 'NewStrongPass123!',
      })
      expect(mockReplace).toHaveBeenCalledWith('/sessions')
    })

    expect(queryClient.getQueryData(queryKeys.auth.me())).toEqual(
      mockCandidateUser
    )
    expect(queryClient.getQueryData(['sessions', 'list'])).toBeUndefined()
  })

  it('redirects admin users to /admin/dashboard after confirmPasswordReset', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.confirmPasswordReset).mockResolvedValueOnce(
      mockAdminUser
    )

    render(<ResetPasswordClient />)
    await advanceToStepTwo(user, 'admin@example.com')

    await typePinCode(user, '654321')
    await user.type(
      screen.getByPlaceholderText('Ít nhất 12 ký tự'),
      'AdminStrongPass123!'
    )
    await user.type(
      screen.getByPlaceholderText('Nhập lại mật khẩu mới'),
      'AdminStrongPass123!'
    )
    await user.click(
      screen.getByRole('button', { name: 'Xác nhận đổi mật khẩu' })
    )

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/admin/dashboard')
    })
  })

  it('allows going back to step 1 and maps INVALID_VERIFICATION_CODE to code error', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.confirmPasswordReset).mockRejectedValueOnce(
      new ApiClientError(
        'Mã xác thực không chính xác hoặc đã hết hạn.',
        400,
        'INVALID_VERIFICATION_CODE'
      )
    )

    render(<ResetPasswordClient />)
    await advanceToStepTwo(user)

    await typePinCode(user, '000000')
    await user.type(
      screen.getByPlaceholderText('Ít nhất 12 ký tự'),
      'NewStrongPass123!'
    )
    await user.type(
      screen.getByPlaceholderText('Nhập lại mật khẩu mới'),
      'NewStrongPass123!'
    )
    await user.click(
      screen.getByRole('button', { name: 'Xác nhận đổi mật khẩu' })
    )

    await waitFor(() => {
      const errorMatches = screen.getAllByText(
        'Mã xác thực không chính xác hoặc đã hết hạn.'
      )
      expect(errorMatches.length).toBeGreaterThanOrEqual(2)
    })

    await user.click(
      screen.getByRole('button', { name: 'Đổi email / Gửi lại mã' })
    )
    expect(
      screen.getByRole('heading', { name: 'Quên mật khẩu?' })
    ).toBeInTheDocument()
  })
})
