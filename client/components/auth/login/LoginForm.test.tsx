import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'jest-axe'
import { render, screen, userEvent, waitFor } from '@test-utils'
import LoginForm from './LoginForm'

describe('LoginForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('renders fields, submit button, and register/reset-password links cleanly', async () => {
    const { container } = render(<LoginForm onSubmit={mockOnSubmit} />)

    expect(
      screen.getByRole('heading', { name: 'Đăng nhập' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mật khẩu/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Đăng nhập' })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Đăng ký' })).toHaveAttribute(
      'href',
      '/register'
    )
    expect(
      screen.getByRole('link', { name: 'Quên mật khẩu?' })
    ).toHaveAttribute('href', '/reset-password')

    expect(await axe(container)).toHaveNoViolations()
  })

  it('displays validation errors when fields are empty', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={mockOnSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByText('Email là bắt buộc')).toBeInTheDocument()
    expect(await screen.findByText('Mật khẩu là bắt buộc')).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('displays validation error for invalid email', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={mockOnSubmit} />)

    await user.type(screen.getByPlaceholderText('Nhập email'), 'invalid-email')
    await user.type(
      screen.getByPlaceholderText('Nhập mật khẩu'),
      'validpassword123'
    )
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByText('Email không hợp lệ')).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with trimmed email when form is valid', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSubmit={mockOnSubmit} />)

    await user.type(
      screen.getByPlaceholderText('Nhập email'),
      'test@example.com'
    )
    await user.type(
      screen.getByPlaceholderText('Nhập mật khẩu'),
      'validpassword123'
    )
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'validpassword123',
      })
    })
  })

  it('disables inputs and submit button during loading', () => {
    render(<LoginForm onSubmit={mockOnSubmit} loading />)
    const button = screen.getByRole('button', { name: 'Đăng nhập' })
    expect(button).toBeDisabled()
    expect(screen.getByPlaceholderText('Nhập email')).toBeDisabled()
  })

  it('displays serverError, inactiveMessage, sessionExpiredMessage, and fieldErrors', () => {
    const { rerender } = render(
      <LoginForm onSubmit={mockOnSubmit} serverError="Server error message" />
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Server error message')

    rerender(
      <LoginForm
        onSubmit={mockOnSubmit}
        inactiveMessage="Tài khoản đã bị khóa"
        sessionExpiredMessage="Phiên hết hạn"
      />
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Tài khoản đã bị khóa')

    rerender(
      <LoginForm
        onSubmit={mockOnSubmit}
        sessionExpiredMessage="Phiên đăng nhập đã hết hạn."
        fieldErrors={{ email: 'Lỗi email từ server' }}
      />
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Phiên đăng nhập đã hết hạn.'
    )
    expect(screen.getByText('Lỗi email từ server')).toBeInTheDocument()
  })
})
