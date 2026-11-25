import { render, screen } from '@test-utils'
import { axe } from 'jest-axe'
import { BrandLogo } from './BrandLogo'

describe('BrandLogo', () => {
  it('renders mark + wordmark lockup with accessible name by default', async () => {
    const { container } = render(<BrandLogo />)

    const wordmark = screen.getByRole('img', { name: 'Intervia' })
    expect(wordmark).toHaveAttribute('src', '/brand/intervia-wordmark.png')
    expect(
      container.querySelector('img[src="/brand/intervia-mark.png"]')
    ).toHaveAttribute('aria-hidden', 'true')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders mark-only and wordmark-only variants', () => {
    const { unmount } = render(<BrandLogo variant="mark" size="sm" />)
    expect(screen.getByRole('img', { name: 'Intervia' })).toHaveAttribute(
      'src',
      '/brand/intervia-mark.png'
    )
    unmount()

    render(<BrandLogo variant="wordmark" size="lg" />)
    expect(screen.getByRole('img', { name: 'Intervia' })).toHaveAttribute(
      'src',
      '/brand/intervia-wordmark.png'
    )
  })

  it('hides images from screen readers when decorative is true', async () => {
    const { container } = render(<BrandLogo variant="lockup" decorative />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(container.querySelectorAll('img')).toHaveLength(2)
    expect(await axe(container)).toHaveNoViolations()
  })
})
