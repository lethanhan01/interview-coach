import { render, screen } from '@test-utils'
import { axe } from 'jest-axe'
import { CtaSection } from './CtaSection'

describe('CtaSection', () => {
  it('renders CTA heading and register/login links', () => {
    render(<CtaSection />)

    expect(
      screen.getByRole('heading', { level: 2, name: /sẵn sàng luyện tập/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /đăng ký miễn phí/i })
    ).toHaveAttribute('href', '/register')
    expect(
      screen.getByRole('link', { name: /đã có tài khoản/i })
    ).toHaveAttribute('href', '/login')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<CtaSection />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
