import type { Meta, StoryObj } from '@storybook/react'
import ProfileField from '../../components/profile/ProfileField'

const meta: Meta<typeof ProfileField> = {
  title: 'Feature/Profile/ProfileField',
  component: ProfileField,
  tags: ['autodocs'],
  args: {
    label: 'Chuyên môn',
    value: 'Frontend Developer',
  },
}

export default meta
type Story = StoryObj<typeof ProfileField>

export const Default: Story = {}
