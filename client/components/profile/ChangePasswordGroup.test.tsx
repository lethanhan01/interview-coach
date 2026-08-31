import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import ChangePasswordGroup from './ChangePasswordGroup'
import { apiClient } from '@/lib/api-client'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

describe('ChangePasswordGroup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all password input fields and submit button', () => {
    render(<ChangePasswordGroup />)
    expect(screen.getByText('Đổi mật khẩu & Bảo mật')).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu hiện tại')).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu mới')).toBeInTheDocument()
    expect(screen.getByLabelText('Xác nhận mật khẩu mới')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Cập nhật mật khẩu/i })
    ).toBeInTheDocument()
  })

  it('shows validation error when current password is empty', async () => {
    const user = userEvent.setup()
    render(<ChangePasswordGroup />)

    const submitBtn = screen.getByRole('button', { name: /Cập nhật mật khẩu/i })
    await user.click(submitBtn)

    expect(
      await screen.findByText('Vui lòng nhập mật khẩu hiện tại.')
    ).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('shows validation error when new password is less than 8 characters', async () => {
    const user = userEvent.setup()
    render(<ChangePasswordGroup />)

    await user.type(screen.getByLabelText('Mật khẩu hiện tại'), 'oldPassword123')
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'short')
    await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'short')

    const submitBtn = screen.getByRole('button', { name: /Cập nhật mật khẩu/i })
    await user.click(submitBtn)

    expect(
      await screen.findByText('Mật khẩu mới phải có ít nhất 8 ký tự.')
    ).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('shows validation error when confirmation password does not match', async () => {
    const user = userEvent.setup()
    render(<ChangePasswordGroup />)

    await user.type(screen.getByLabelText('Mật khẩu hiện tại'), 'oldPassword123')
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'newPassword123')
    await user.type(screen.getByLabelText('Xác nhận mật khẩu mới'), 'mismatch123')

    const submitBtn = screen.getByRole('button', { name: /Cập nhật mật khẩu/i })
    await user.click(submitBtn)

    expect(
      await screen.findByText('Mật khẩu xác nhận không khớp.')
    ).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('submits successfully and clears fields on valid input', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true })

    render(<ChangePasswordGroup />)

    const currentInput = screen.getByLabelText('Mật khẩu hiện tại')
    const newInput = screen.getByLabelText('Mật khẩu mới')
    const confirmInput = screen.getByLabelText('Xác nhận mật khẩu mới')

    await user.type(currentInput, 'oldPassword123')
    await user.type(newInput, 'newStrongPassword123')
    await user.type(confirmInput, 'newStrongPassword123')

    const submitBtn = screen.getByRole('button', { name: /Cập nhật mật khẩu/i })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'oldPassword123',
        newPassword: 'newStrongPassword123',
      })
    })

    expect(
      await screen.findByText('Đổi mật khẩu thành công!')
    ).toBeInTheDocument()
    expect(currentInput).toHaveValue('')
    expect(newInput).toHaveValue('')
    expect(confirmInput).toHaveValue('')
  })
})
