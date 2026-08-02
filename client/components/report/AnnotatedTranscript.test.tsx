import { render } from '@testing-library/react'
import { expect, it, describe } from 'vitest'
import AnnotatedTranscript from './AnnotatedTranscript'

describe('AnnotatedTranscript', () => {
  it('renders correctly', () => {
    const { container } = render(<AnnotatedTranscript items={[]} />)
    expect(container).toBeInTheDocument()
  })
})
