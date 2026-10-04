import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Progress } from './Progress'

describe('Progress Component', () => {
  it('renders progressbar with correct role and aria values', () => {
    render(<Progress value={45} max={100} aria-label="Hoàn thành hồ sơ" />)
    const progress = screen.getByRole('progressbar', { name: 'Hoàn thành hồ sơ' })
    expect(progress).toBeInTheDocument()
    expect(progress).toHaveAttribute('aria-valuenow', '45')
    expect(progress).toHaveAttribute('aria-valuemin', '0')
    expect(progress).toHaveAttribute('aria-valuemax', '100')
  })

  it('clamps values outside bounds', () => {
    const { rerender } = render(<Progress value={150} />)
    let progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '100')

    rerender(<Progress value={-20} />)
    progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '0')
  })

  it('applies variant classes correctly', () => {
    const { container } = render(<Progress value={75} variant="success" size="lg" />)
    const progress = container.querySelector('[role="progressbar"]')
    expect(progress).toHaveClass('h-4')
  })
})
