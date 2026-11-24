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
import ChangePasswordGroup from './ChangePasswordGroup'

vi.mock('@/services/auth.service', () => ({
  authService: {
    changePassword: vi.fn(),
  },
}))

const mockUpdatedUser: AuthUser = {
  id: 'user-1',
  email: 'test@example.com',
  role: 'candidate',
  status: 'active',
  firstname: 'An',
  lastname: 'Nguyễn',
  emailVerified: true,
}

describe('ChangePasswordGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders password fields, strength meter, and passes a11y checks', async () => {
    const { container } = render(<ChangePasswordGroup />)

    expect(screen.getByText('Đổi mật khẩu & Bảo mật')).toBeInTheDocument()
    expect(screen.getByLabelText(/Mật khẩu hiện tại/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Mật khẩu mới/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Xác nhận mật khẩu mới/i)).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', { name: 'Độ mạnh mật khẩu' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Cập nhật mật khẩu/i })
    ).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('validates empty current password, 12-char minimum, duplicate password, and mismatch', async () => {
    const user = userEvent.setup()
    render(<ChangePasswordGroup />)

    const submitBtn = screen.getByRole('button', { name: /Cập nhật mật khẩu/i })
    await user.click(submitBtn)

    expect(
      await screen.findByText('Vui lòng nhập mật khẩu hiện tại')
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Mật khẩu phải có ít nhất 12 ký tự')
    ).toBeInTheDocument()
    expect(authService.changePassword).not.toHaveBeenCalled()

    await user.type(
      screen.getByLabelText(/Mật khẩu hiện tại/i),
      'SamePassword123!'
    )
    await user.type(screen.getByLabelText(/^Mật khẩu mới/i), 'SamePassword123!')
    await user.type(
      screen.getByLabelText(/Xác nhận mật khẩu mới/i),
      'DifferentPass123!'
    )
    await user.click(submitBtn)

    expect(
      await screen.findByText(
        'Mật khẩu mới không được trùng với mật khẩu hiện tại'
      )
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Mật khẩu xác nhận không khớp')
    ).toBeInTheDocument()
    expect(authService.changePassword).not.toHaveBeenCalled()
  })

  it('submits valid password change, updates auth.me cache, and resets inputs', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    queryClient.setDefaultOptions({
      queries: { retry: false, staleTime: 30_000, gcTime: 60_000 },
    })
    vi.mocked(authService.changePassword).mockResolvedValueOnce(mockUpdatedUser)

    render(<ChangePasswordGroup />, { queryClient })

    const currentInput = screen.getByLabelText(/Mật khẩu hiện tại/i)
    const newInput = screen.getByLabelText(/^Mật khẩu mới/i)
    const confirmInput = screen.getByLabelText(/Xác nhận mật khẩu mới/i)

    await user.type(currentInput, 'OldPassword123!')
    await user.type(newInput, 'NewStrongPassword123!')
    await user.type(confirmInput, 'NewStrongPassword123!')
    await user.click(screen.getByRole('button', { name: /Cập nhật mật khẩu/i }))

    await waitFor(() => {
      expect(authService.changePassword).toHaveBeenCalledWith(
        'OldPassword123!',
        'NewStrongPassword123!'
      )
    })

    expect(
      await screen.findByText('Đổi mật khẩu thành công!')
    ).toBeInTheDocument()
    expect(queryClient.getQueryData(queryKeys.auth.me())).toEqual(
      mockUpdatedUser
    )
    expect(screen.getByLabelText(/Mật khẩu hiện tại/i)).toHaveValue('')
    expect(screen.getByLabelText(/^Mật khẩu mới/i)).toHaveValue('')
    expect(screen.getByLabelText(/Xác nhận mật khẩu mới/i)).toHaveValue('')
  })

  it('maps INVALID_CREDENTIALS server error onto currentPassword field and alert', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.changePassword).mockRejectedValueOnce(
      new ApiClientError(
        'Email hoặc mật khẩu không chính xác.',
        401,
        'INVALID_CREDENTIALS'
      )
    )

    render(<ChangePasswordGroup />)

    await user.type(
      screen.getByLabelText(/Mật khẩu hiện tại/i),
      'WrongCurrent123!'
    )
    await user.type(
      screen.getByLabelText(/^Mật khẩu mới/i),
      'NewStrongPassword123!'
    )
    await user.type(
      screen.getByLabelText(/Xác nhận mật khẩu mới/i),
      'NewStrongPassword123!'
    )
    await user.click(screen.getByRole('button', { name: /Cập nhật mật khẩu/i }))

    await waitFor(() => {
      const matches = screen.getAllByText(
        'Email hoặc mật khẩu không chính xác.'
      )
      expect(matches.length).toBeGreaterThanOrEqual(2)
    })
  })
})
