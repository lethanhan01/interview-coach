import { render, screen } from '@test-utils'
import { axe } from 'jest-axe'
import { HeroSection } from './HeroSection'

describe('HeroSection', () => {
  it('renders hero heading, preview card, and primary/secondary CTAs', () => {
    render(<HeroSection />)

    expect(
      screen.getByRole('heading', { level: 1, name: /luyện phỏng vấn/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /bắt đầu miễn phí/i })
    ).toHaveAttribute('href', '/register')
    expect(screen.getByRole('link', { name: /đăng nhập/i })).toHaveAttribute(
      'href',
      '/login'
    )
    expect(screen.getByText('84/100')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<HeroSection />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
