import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Switch } from './switch'
import { Label } from './label'
import { axe } from 'jest-axe'
import { vi } from 'vitest'

describe('Switch Component', () => {
  it('renders correctly', () => {
    render(
      <div className="flex items-center space-x-2">
        <Switch id="test-switch" />
        <Label htmlFor="test-switch">Test Switch</Label>
      </div>
    )
    expect(screen.getByRole('switch')).toBeInTheDocument()
    expect(screen.getByLabelText('Test Switch')).toBeInTheDocument()
  })

  it('passes a11y checks', async () => {
    const { container } = render(
      <div className="flex items-center space-x-2">
        <Switch id="a11y-switch" />
        <Label htmlFor="a11y-switch">A11y Switch</Label>
      </div>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('toggles state when clicked', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    
    render(
      <div className="flex items-center space-x-2">
        <Switch id="toggle-switch" onCheckedChange={onCheckedChange} />
        <Label htmlFor="toggle-switch">Toggle Switch</Label>
      </div>
    )
    
    const switchElement = screen.getByRole('switch')
    
    // Radix Switch uses `data-state` or `aria-checked` to manage checked state visually
    // but toBeChecked() works with it as well if role="switch" uses aria-checked
    expect(switchElement).not.toBeChecked()
    
    await user.click(switchElement)
    
    expect(switchElement).toBeChecked()
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Switch disabled />)
    expect(screen.getByRole('switch')).toBeDisabled()
  })

  it('applies invalid styles when aria-invalid is true', () => {
    render(<Switch aria-invalid="true" />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement.className).toContain('aria-invalid:ring-2')
  })
})
