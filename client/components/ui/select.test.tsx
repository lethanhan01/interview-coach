import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { axe } from 'jest-axe'
import { vi, beforeAll } from 'vitest'

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

describe('Select Component', () => {
  const TestSelect = ({ invalid = false, disabled = false, onChange = () => {} }) => (
    <Select disabled={disabled} onValueChange={onChange}>
      <SelectTrigger aria-label="Options" invalid={invalid}>
        <SelectValue placeholder="Select option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">Option 1</SelectItem>
        <SelectItem value="2">Option 2</SelectItem>
      </SelectContent>
    </Select>
  )

  it('renders correctly', () => {
    render(<TestSelect />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Select option')).toBeInTheDocument()
  })

  it('passes a11y checks', async () => {
    const { container } = render(<TestSelect />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('opens options on click', async () => {
    const user = userEvent.setup()
    render(<TestSelect />)
    
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })
    expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument()
  })

  it('selects an option and updates value', async () => {
    const user = userEvent.setup()
    const onChangeMock = vi.fn()
    render(<TestSelect onChange={onChangeMock} />)
    
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument()
    })
    
    const option1 = screen.getByRole('option', { name: 'Option 1' })
    await user.click(option1)
    
    expect(onChangeMock).toHaveBeenCalledWith('1')
  })

  it('disables trigger when disabled prop is true', () => {
    render(<TestSelect disabled />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeDisabled()
  })

  it('applies invalid styles when invalid prop is true', () => {
    render(<TestSelect invalid />)
    const trigger = screen.getByRole('combobox')
    // We expect border-destructive or focus-visible:ring-destructive
    expect(trigger.className).toContain('border-destructive')
  })
})
