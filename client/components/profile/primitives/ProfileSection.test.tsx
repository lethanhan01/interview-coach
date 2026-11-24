import { describe, expect, it } from 'vitest'
import { Button, Text } from '@mantine/core'
import { render, screen } from '@test-utils'
import ProfileSection from './ProfileSection'

describe('ProfileSection', () => {
  it('renders title, action slot, and children', () => {
    render(
      <ProfileSection
        title="Thông tin học vấn"
        action={
          <Button type="button" size="xs">
            Thêm
          </Button>
        }
      >
        <Text size="sm">Nội dung chi tiết</Text>
      </ProfileSection>
    )

    expect(
      screen.getByRole('heading', { name: 'Thông tin học vấn' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thêm' })).toBeInTheDocument()
    expect(screen.getByText('Nội dung chi tiết')).toBeInTheDocument()
  })
})
