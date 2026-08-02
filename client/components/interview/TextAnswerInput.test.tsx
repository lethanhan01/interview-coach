import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, describe, vi } from 'vitest'
import TextAnswerInput from '../../components/interview/TextAnswerInput'

describe('TextAnswerInput', () => {
  it('renders correctly and allows typing', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TextAnswerInput onSubmit={mockSubmit} />)
    
    const textarea = screen.getByRole('textbox', { name: 'Câu trả lời của bạn' })
    expect(textarea).toBeInTheDocument()
    
    await userEvent.type(textarea, 'This is my answer')
    expect(textarea).toHaveValue('This is my answer')
  })

  it('calls onSubmit and clears input on success', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TextAnswerInput onSubmit={mockSubmit} />)
    
    const textarea = screen.getByRole('textbox', { name: 'Câu trả lời của bạn' })
    const submitButton = screen.getByRole('button', { name: 'Gửi câu trả lời' })
    
    expect(submitButton).toBeDisabled() // disabled when empty
    
    await userEvent.type(textarea, 'Test answer')
    expect(submitButton).toBeEnabled()
    
    await userEvent.click(submitButton)
    
    expect(mockSubmit).toHaveBeenCalledWith('Test answer')
    
    await waitFor(() => {
      expect(textarea).toHaveValue('')
    })
  })

  it('displays error message on submission failure', async () => {
    const mockSubmit = vi.fn().mockRejectedValue(new Error('Submit failed'))
    render(<TextAnswerInput onSubmit={mockSubmit} />)
    
    const textarea = screen.getByRole('textbox', { name: 'Câu trả lời của bạn' })
    const submitButton = screen.getByRole('button', { name: 'Gửi câu trả lời' })
    
    await userEvent.type(textarea, 'Test answer')
    await userEvent.click(submitButton)
    
    const errorMessage = await screen.findByRole('alert')
    expect(errorMessage).toHaveTextContent('Submit failed')
    expect(textarea).toHaveValue('Test answer') // Should not clear
  })

  it('disables input and button when disabled prop is true', () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TextAnswerInput onSubmit={mockSubmit} disabled={true} />)
    
    const textarea = screen.getByRole('textbox', { name: 'Câu trả lời của bạn' })
    const submitButton = screen.getByRole('button', { name: 'Gửi câu trả lời' })
    
    expect(textarea).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })
})
