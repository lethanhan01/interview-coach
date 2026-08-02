import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { Input } from './Input'
import { axe } from 'jest-axe'

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Nhập dữ liệu" />)
    expect(screen.getByPlaceholderText('Nhập dữ liệu')).toBeInTheDocument()
  })

  it('allows user to type', async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Nhập dữ liệu" />)
    const input = screen.getByPlaceholderText('Nhập dữ liệu')
    await user.type(input, 'Hello World')
    expect(input).toHaveValue('Hello World')
  })

  it('can be disabled', () => {
    render(<Input disabled placeholder="Disabled input" />)
    expect(screen.getByPlaceholderText('Disabled input')).toBeDisabled()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<Input aria-label="Accessible input" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
