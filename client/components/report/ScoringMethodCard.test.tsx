import { render } from '@testing-library/react'
import { expect, it, describe } from 'vitest'
import ScoringMethodCard from './ScoringMethodCard'

describe('ScoringMethodCard', () => {
  it('renders correctly', () => {
    const { container } = render(<ScoringMethodCard contextPackId="VN" sessionType="hr" />)
    expect(container).toBeInTheDocument()
  })
})
