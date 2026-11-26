import { describe, expect, it } from 'vitest'
import { axe } from 'jest-axe'
import { Box } from '@mantine/core'
import { render, screen } from '@test-utils'
import ProfileField from './ProfileField'

describe('ProfileField', () => {
  it('renders label and value', async () => {
    const { container } = render(
      <Box component="dl">
        <ProfileField label="Chuyên môn" value="Frontend Engineer" />
      </Box>
    )

    expect(screen.getByText('Chuyên môn')).toBeInTheDocument()
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders emptyValue fallback when value is empty or undefined', () => {
    render(
      <Box component="dl">
        <ProfileField label="Ghi chú" value="" emptyValue="Chưa có" />
      </Box>
    )

    expect(screen.getByText('Ghi chú')).toBeInTheDocument()
    expect(screen.getByText('Chưa có')).toBeInTheDocument()
  })
})
