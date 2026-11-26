import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'jest-axe'
import { render, screen, userEvent, waitFor } from '@test-utils'
import RegisterForm from './RegisterForm'

describe('RegisterForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all form fields, password strength meter, and passes a11y checks', async () => {
    const { container } = render(<RegisterForm onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText(/Họ/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Tên/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ít nhất 12 ký tự')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nhập lại mật khẩu')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', { name: 'Độ mạnh mật khẩu' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đăng ký' })).toBeInTheDocument()

    expect(await axe(container)).toHaveNoViolations()
  })

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup()
    render(<RegisterForm onSubmit={mockOnSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Đăng ký' }))

    expect(await screen.findByText('Họ là bắt buộc')).toBeInTheDocument()
    expect(await screen.findByText('Tên là bắt buộc')).toBeInTheDocument()
    expect(await screen.findByText('Email là bắt buộc')).toBeInTheDocument()
    expect(
      await screen.findByText('Mật khẩu phải có ít nhất 12 ký tự')
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Vui lòng xác nhận mật khẩu')
    ).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error when passwords do not match and updates strength meter', async () => {
    const user = userEvent.setup()
    render(<RegisterForm onSubmit={mockOnSubmit} />)

    await user.type(screen.getByLabelText(/Họ/i), 'Nguyễn')
    await user.type(screen.getByLabelText(/Tên/i), 'Văn A')
    await user.type(screen.getByLabelText(/Email/i), 'test@example.com')
    await user.type(
      screen.getByPlaceholderText('Ít nhất 12 ký tự'),
      'ValidPassword123!'
    )
    expect(screen.getByText('Mạnh')).toBeInTheDocument()

    await user.type(
      screen.getByPlaceholderText('Nhập lại mật khẩu'),
      'DifferentPassword!'
    )
    await user.click(screen.getByRole('button', { name: 'Đăng ký' }))

    expect(
      await screen.findByText('Mật khẩu và xác nhận mật khẩu không khớp')
    ).toBeInTheDocument()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with valid form values', async () => {
    const user = userEvent.setup()
    render(<RegisterForm onSubmit={mockOnSubmit} />)

    await user.type(screen.getByLabelText(/Họ/i), 'Nguyễn')
    await user.type(screen.getByLabelText(/Tên/i), 'Văn A')
    await user.type(screen.getByLabelText(/Email/i), 'test@example.com')
    await user.type(
      screen.getByPlaceholderText('Ít nhất 12 ký tự'),
      'ValidPassword123!'
    )
    await user.type(
      screen.getByPlaceholderText('Nhập lại mật khẩu'),
      'ValidPassword123!'
    )
    await user.click(screen.getByRole('button', { name: 'Đăng ký' }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        lastname: 'Nguyễn',
        firstname: 'Văn A',
        email: 'test@example.com',
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
      })
    })
  })

  it('displays serverError, fieldErrors, and disables submit when loading', () => {
    const { rerender } = render(
      <RegisterForm
        onSubmit={mockOnSubmit}
        serverError="Email đã tồn tại"
        fieldErrors={{ email: 'Email này đã được sử dụng.' }}
      />
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Email đã tồn tại')
    expect(screen.getByText('Email này đã được sử dụng.')).toBeInTheDocument()

    rerender(<RegisterForm onSubmit={mockOnSubmit} loading />)
    expect(screen.getByRole('button', { name: 'Đăng ký' })).toBeDisabled()
  })
})
