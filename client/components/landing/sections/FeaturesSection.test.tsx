import { render, screen } from '@test-utils'
import { axe } from 'jest-axe'
import { FeaturesSection } from './FeaturesSection'

describe('FeaturesSection', () => {
  it('renders features heading and 3 core feature cards', () => {
    render(<FeaturesSection />)

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /tại sao chọn intervia/i,
      })
    ).toBeInTheDocument()
    expect(screen.getByText('AI Follow-up thông minh')).toBeInTheDocument()
    expect(screen.getByText('Surgical Feedback')).toBeInTheDocument()
    expect(screen.getByText('Context Pack VN / Western')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<FeaturesSection />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
