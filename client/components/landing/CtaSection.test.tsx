import { render, screen } from '@testing-library/react'
import { expect, it, describe } from 'vitest'
import { CtaSection } from '../../components/landing/CtaSection'

describe('CtaSection', () => {
  it('renders correctly', () => {
    render(<CtaSection />)
    
    expect(screen.getByRole('heading', { name: /sẵn sàng luyện tập/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /đăng ký miễn phí/i })).toBeInTheDocument()
  })
})
