import { render } from '@testing-library/react'
import { expect, it, describe } from 'vitest'
import ProfileField from './ProfileField'

describe('ProfileField', () => {
  it('renders correctly', () => {
    const { container } = render(<ProfileField label="Name" value="Test" />)
    expect(container).toBeInTheDocument()
  })
})

