import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RegisterForm from './RegisterForm'

describe('RegisterForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all form fields and submit button', () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />)
    
    expect(screen.getByLabelText(/Họ/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Tên/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ít nhất 12 ký tự', { exact: false })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nhập lại mật khẩu', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Đăng ký/i })).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty form', async () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />)
    
    const submitButton = screen.getByRole('button', { name: /Đăng ký/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Họ là bắt buộc/i)).toBeInTheDocument()
      expect(screen.getByText(/Tên là bắt buộc/i)).toBeInTheDocument()
      expect(screen.getByText(/Email là bắt buộc/i)).toBeInTheDocument()
      expect(screen.getByText(/Mật khẩu phải có ít nhất 12 ký tự/i)).toBeInTheDocument()
      expect(screen.getByText(/Vui lòng xác nhận mật khẩu/i)).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error when passwords do not match', async () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />)
    
    await userEvent.type(screen.getByLabelText(/Họ/i), 'Nguyễn')
    await userEvent.type(screen.getByLabelText(/Tên/i), 'Văn A')
    await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com')
    await userEvent.type(screen.getByPlaceholderText('Ít nhất 12 ký tự', { exact: false }), 'ValidPassword123!')
    await userEvent.type(screen.getByPlaceholderText('Nhập lại mật khẩu', { exact: false }), 'DifferentPassword!')
    
    const submitButton = screen.getByRole('button', { name: /Đăng ký/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Mật khẩu và xác nhận mật khẩu không khớp/i)).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with form data when valid', async () => {
    render(<RegisterForm onSubmit={mockOnSubmit} />)
    
    await userEvent.type(screen.getByLabelText(/Họ/i), 'Nguyễn')
    await userEvent.type(screen.getByLabelText(/Tên/i), 'Văn A')
    await userEvent.type(screen.getByLabelText(/Email/i), 'test@example.com')
    await userEvent.type(screen.getByPlaceholderText('Ít nhất 12 ký tự', { exact: false }), 'ValidPassword123!')
    await userEvent.type(screen.getByPlaceholderText('Nhập lại mật khẩu', { exact: false }), 'ValidPassword123!')
    
    const submitButton = screen.getByRole('button', { name: /Đăng ký/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        {
          lastname: 'Nguyễn',
          firstname: 'Văn A',
          email: 'test@example.com',
          password: 'ValidPassword123!',
          confirmPassword: 'ValidPassword123!',
        },
        expect.anything()
      )
    })
  })


  it('displays server error when provided', () => {
    render(
      <RegisterForm 
        onSubmit={mockOnSubmit} 
        serverError="Email đã tồn tại" 
      />
    )
    
    expect(screen.getByText('Email đã tồn tại')).toBeInTheDocument()
  })

  it('disables submit button when loading', () => {
    render(<RegisterForm onSubmit={mockOnSubmit} loading={true} />)
    
    const submitButton = screen.getByRole('button', { name: /Đăng ký/i })
    expect(submitButton).toBeDisabled()
  })
})

