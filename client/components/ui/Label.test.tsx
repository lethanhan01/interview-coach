import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Label } from './Label'
import { axe } from 'jest-axe'

describe('Label', () => {
  it('renders correctly', () => {
    render(<Label>My Label</Label>)
    expect(screen.getByText('My Label')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <>
        <Label htmlFor="test-input">Test Label</Label>
        <input id="test-input" type="text" />
      </>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
