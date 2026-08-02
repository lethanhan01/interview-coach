import type { Meta, StoryObj } from '@storybook/react'
import ProfileEmptyState from '../../components/profile/ProfileEmptyState'

const meta: Meta<typeof ProfileEmptyState> = {
  title: 'Feature/Profile/ProfileEmptyState',
  component: ProfileEmptyState,
  tags: ['autodocs'],
  args: {
    message: 'Chưa có thông tin.',
  },
}

export default meta
type Story = StoryObj<typeof ProfileEmptyState>

export const Default: Story = {}
