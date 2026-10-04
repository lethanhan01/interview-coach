import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import LogoutButton from './LogoutButton'

const meta: Meta<typeof LogoutButton> = {
  title: 'Feature/Auth/LogoutButton',
  component: LogoutButton,
  tags: ['autodocs'],
  args: {
    className: '',
  },
}

export default meta
type Story = StoryObj<typeof LogoutButton>

export const Default: Story = {
  args: {},
}

export const DestructiveVariant: Story = {
  args: {
    variant: 'destructive',
  },
}
