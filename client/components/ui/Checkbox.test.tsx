import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'jest-axe'

import { Checkbox } from './Checkbox'
import { Label } from './Label'

const setup = (jsx: React.ReactElement) => ({
  user: userEvent.setup(),
  ...render(jsx),
})

describe('Checkbox — Render', () => {
  it('renders correctly', () => {
    render(<Checkbox aria-label="Accept" />)
    expect(screen.getByRole('checkbox', { name: 'Accept' })).toBeInTheDocument()
  })
})

describe('Checkbox — Accessibility', () => {
  it('should not have basic accessibility violations', async () => {
    const { container } = render(
      <div className="flex items-center gap-2">
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept terms</Label>
      </div>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe('Checkbox — Interaction', () => {
  it('can be checked via click', async () => {
    const handleCheckedChange = vi.fn()
    const { user } = setup(<Checkbox aria-label="Accept" onCheckedChange={handleCheckedChange} />)
    
    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)
    expect(handleCheckedChange).toHaveBeenCalledWith(true)
  })

  it('can be focused via Tab and toggled via Space', async () => {
    const handleCheckedChange = vi.fn()
    const { user } = setup(<Checkbox aria-label="Accept" onCheckedChange={handleCheckedChange} />)
    
    await user.tab()
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveFocus()
    
    await user.keyboard('{ }')
    expect(handleCheckedChange).toHaveBeenCalledWith(true)
  })
})

describe('Checkbox — Disabled', () => {
  it('cannot be checked when disabled', async () => {
    const handleCheckedChange = vi.fn()
    const { user } = setup(<Checkbox aria-label="Accept" disabled onCheckedChange={handleCheckedChange} />)
    
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeDisabled()
    
    await user.click(checkbox)
    expect(handleCheckedChange).not.toHaveBeenCalled()
  })
})
