import { render, screen } from '@testing-library/react'
import { expect, it, describe } from 'vitest'
import { FeaturesSection } from '../../components/landing/FeaturesSection'

describe('FeaturesSection', () => {
  it('renders features correctly', () => {
    render(<FeaturesSection />)
    
    expect(screen.getByRole('heading', { name: /tại sao chọn ai mock interview/i })).toBeInTheDocument()
    
    // Check if feature titles are present
    expect(screen.getByText('AI Follow-up thông minh')).toBeInTheDocument()
    expect(screen.getByText('Surgical Feedback')).toBeInTheDocument()
    expect(screen.getByText('Context Pack VN / Western')).toBeInTheDocument()
  })
})
