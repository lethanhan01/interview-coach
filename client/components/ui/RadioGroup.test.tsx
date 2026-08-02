import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'jest-axe'

import { RadioGroup, RadioGroupItem } from './RadioGroup'
import { Label } from './Label'

const setup = (jsx: React.ReactElement) => ({
  user: userEvent.setup(),
  ...render(jsx),
})

describe('RadioGroup — Render', () => {
  it('renders correctly', () => {
    render(
      <RadioGroup aria-label="Options">
        <RadioGroupItem value="a" aria-label="Option A" />
        <RadioGroupItem value="b" aria-label="Option B" />
      </RadioGroup>
    )
    expect(screen.getByRole('radiogroup', { name: 'Options' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })
})

describe('RadioGroup — Accessibility', () => {
  it('should not have basic accessibility violations', async () => {
    const { container } = render(
      <RadioGroup aria-label="Options">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="a" id="r1" />
          <Label htmlFor="r1">Option A</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="b" id="r2" />
          <Label htmlFor="r2">Option B</Label>
        </div>
      </RadioGroup>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})

describe('RadioGroup — Interaction', () => {
  it('can select an item via click', async () => {
    const handleValueChange = vi.fn()
    const { user } = setup(
      <RadioGroup aria-label="Options" onValueChange={handleValueChange}>
        <RadioGroupItem value="a" aria-label="Option A" />
        <RadioGroupItem value="b" aria-label="Option B" />
      </RadioGroup>
    )
    
    const radios = screen.getAllByRole('radio')
    await user.click(radios[1])
    expect(handleValueChange).toHaveBeenCalledWith('b')
  })

  it('can navigate via keyboard (Arrows)', async () => {
    const { user } = setup(
      <RadioGroup aria-label="Options">
        <RadioGroupItem value="a" aria-label="Option A" />
        <RadioGroupItem value="b" aria-label="Option B" />
      </RadioGroup>
    )
    
    await user.tab()
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveFocus()
    
    await user.keyboard('{ArrowDown}')
    expect(radios[1]).toHaveFocus()
  })
})

describe('RadioGroup — Disabled', () => {
  it('cannot interact with disabled items', async () => {
    const handleValueChange = vi.fn()
    const { user } = setup(
      <RadioGroup aria-label="Options" onValueChange={handleValueChange}>
        <RadioGroupItem value="a" aria-label="Option A" disabled />
      </RadioGroup>
    )
    
    const radio = screen.getByRole('radio')
    expect(radio).toBeDisabled()
    
    await user.click(radio)
    expect(handleValueChange).not.toHaveBeenCalled()
  })
})
