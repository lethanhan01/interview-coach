import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from './Textarea'
import { axe } from 'jest-axe'

describe('Textarea Component', () => {
  it('renders correctly', () => {
    render(<Textarea placeholder="Type here" />)
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument()
  })

  it('handles user input', async () => {
    const user = userEvent.setup()
    render(<Textarea placeholder="Input" />)
    const textarea = screen.getByPlaceholderText('Input')
    
    await user.type(textarea, 'Hello world')
    expect(textarea).toHaveValue('Hello world')
  })

  it('renders character count correctly', () => {
    render(<Textarea charCount={10} maxChars={100} />)
    expect(screen.getByText('10/100')).toBeInTheDocument()
  })

  it('applies error styling when invalid', () => {
    render(<Textarea placeholder="Invalid" aria-invalid="true" />)
    const textarea = screen.getByPlaceholderText('Invalid')
    expect(textarea).toHaveClass('border-destructive')
  })

  it('should pass a11y tests', async () => {
    const { container } = render(
      <div className="flex flex-col gap-4">
        <label htmlFor="t1">Label</label>
        <Textarea id="t1" />
        <label htmlFor="t2">Counter</label>
        <Textarea id="t2" charCount={5} maxChars={50} />
      </div>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
