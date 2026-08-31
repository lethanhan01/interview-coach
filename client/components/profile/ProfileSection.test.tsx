import { render } from '@testing-library/react'
import { expect, it, describe } from 'vitest'
import ProfileSection from './ProfileSection'

describe('ProfileSection', () => {
  it('renders correctly', () => {
    const { container } = render(
      <ProfileSection title="Section">
        <div>Content</div>
      </ProfileSection>
    )
    expect(container).toBeInTheDocument()
  })
})

