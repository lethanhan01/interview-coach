import { render } from '@testing-library/react'
import { expect, it, describe } from 'vitest'
import CompetencyScoreChart from './CompetencyScoreChart'

describe('CompetencyScoreChart', () => {
  it('renders correctly', () => {
    const { container } = render(<CompetencyScoreChart scores={{ D1: 80 }} />)
    expect(container).toBeInTheDocument()
  })
})
