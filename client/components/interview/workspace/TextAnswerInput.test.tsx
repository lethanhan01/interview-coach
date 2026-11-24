import { render, screen, userEvent, waitFor } from '@test-utils'
import { axe } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import TextAnswerInput from './TextAnswerInput'

describe('TextAnswerInput', () => {
  it('renders correctly and allows typing', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TextAnswerInput onSubmit={mockSubmit} />)

    const textarea = screen.getByRole('textbox', {
      name: 'Câu trả lời của bạn',
    })
    expect(textarea).toBeInTheDocument()

    await userEvent.type(textarea, 'This is my comprehensive answer')
    expect(textarea).toHaveValue('This is my comprehensive answer')
  })

  it('disables submit button and shows hint when text is under 10 characters', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TextAnswerInput onSubmit={mockSubmit} />)

    const textarea = screen.getByRole('textbox', {
      name: 'Câu trả lời của bạn',
    })
    const submitBtn = screen.getByRole('button', { name: 'Gửi câu trả lời' })

    expect(submitBtn).toBeDisabled()

    await userEvent.type(textarea, 'Ngắn')
    expect(submitBtn).toBeDisabled()
    expect(
      screen.getByText(/Cần tối thiểu 10 ký tự để gửi câu trả lời/i)
    ).toBeInTheDocument()
    expect(screen.getByText('1 từ · 4 ký tự')).toBeInTheDocument()
  })

  it('calls onSubmit and clears input on success when text is 10 or more characters', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TextAnswerInput onSubmit={mockSubmit} />)

    const textarea = screen.getByRole('textbox', {
      name: 'Câu trả lời của bạn',
    })
    const submitBtn = screen.getByRole('button', { name: 'Gửi câu trả lời' })

    await userEvent.type(
      textarea,
      'Tôi áp dụng Clean Architecture và CQRS vào dự án.'
    )
    expect(submitBtn).toBeEnabled()
    expect(screen.getByText(/từ ·.*ký tự/)).toBeInTheDocument()

    await userEvent.click(submitBtn)

    expect(mockSubmit).toHaveBeenCalledWith(
      'Tôi áp dụng Clean Architecture và CQRS vào dự án.'
    )

    await waitFor(() => {
      expect(textarea).toHaveValue('')
    })
  })

  it('displays error message on submission failure and preserves draft', async () => {
    const mockSubmit = vi.fn().mockRejectedValue(new Error('Submit failed'))
    render(<TextAnswerInput onSubmit={mockSubmit} />)

    const textarea = screen.getByRole('textbox', {
      name: 'Câu trả lời của bạn',
    })
    const submitBtn = screen.getByRole('button', { name: 'Gửi câu trả lời' })

    await userEvent.type(
      textarea,
      'Câu trả lời gặp lỗi mạng khi gửi đến máy chủ.'
    )
    await userEvent.click(submitBtn)

    const errorMessage = await screen.findByRole('alert')
    expect(errorMessage).toHaveTextContent('Submit failed')
    expect(textarea).toHaveValue(
      'Câu trả lời gặp lỗi mạng khi gửi đến máy chủ.'
    )
  })

  it('disables input and button when disabled prop is true', () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TextAnswerInput onSubmit={mockSubmit} disabled={true} />)

    const textarea = screen.getByRole('textbox', {
      name: 'Câu trả lời của bạn',
    })
    const submitBtn = screen.getByRole('button', { name: 'Gửi câu trả lời' })

    expect(textarea).toBeDisabled()
    expect(submitBtn).toBeDisabled()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <TextAnswerInput onSubmit={vi.fn().mockResolvedValue(undefined)} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
