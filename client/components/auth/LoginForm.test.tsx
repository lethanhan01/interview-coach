import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginForm from './LoginForm'

describe('LoginForm', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('renders correctly', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />)
    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    // Depending on FormField implementation, we might need to query differently.
    // Dùng regex để match label vì có thêm dấu * (required)
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mật khẩu/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument()
  })

  it('displays validation errors when fields are empty', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />)
    
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    
    await waitFor(() => {
      expect(screen.getByText('Email là bắt buộc')).toBeInTheDocument()
      expect(screen.getByText('Mật khẩu là bắt buộc')).toBeInTheDocument()
    })
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('displays validation error for invalid email', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />)
    
    fireEvent.change(screen.getByPlaceholderText('Nhập email'), { target: { value: 'invalid-email' } })
    fireEvent.change(screen.getByPlaceholderText('Nhập mật khẩu'), { target: { value: 'validpassword123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    
    await waitFor(() => {
      expect(screen.getByText('Email không hợp lệ')).toBeInTheDocument()
    })
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit when form is valid', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />)
    
    fireEvent.change(screen.getByPlaceholderText('Nhập email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('Nhập mật khẩu'), { target: { value: 'validpassword123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'validpassword123'
      }, expect.anything())
    })
  })

  it('displays loading state', () => {
    render(<LoginForm onSubmit={mockOnSubmit} loading={true} />)
    const button = screen.getByRole('button', { name: 'Đang xử lý…' })
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
  })

  it('displays server error', () => {
    render(<LoginForm onSubmit={mockOnSubmit} serverError="Server error message" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Server error message')
  })
})
