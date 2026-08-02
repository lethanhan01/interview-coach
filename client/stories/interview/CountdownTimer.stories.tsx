import type { Meta, StoryObj } from '@storybook/react'
import CountdownTimer from '../../components/interview/CountdownTimer'

const meta: Meta<typeof CountdownTimer> = {
  title: 'Feature/Interview/CountdownTimer',
  component: CountdownTimer,
  tags: ['autodocs'],
  args: {
    initialSeconds: 300, // 5 minutes
    active: true,
  },
}

export default meta
type Story = StoryObj<typeof CountdownTimer>

export const Default: Story = {}

export const Inactive: Story = {
  args: {
    active: false,
  },
}

export const NearExpiration: Story = {
  args: {
    initialSeconds: 15,
  },
}

export const Expired: Story = {
  args: {
    initialSeconds: 0,
  },
}
