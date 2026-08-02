import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import CareerInfoGroup from '../../components/profile/CareerInfoGroup'

const meta: Meta<typeof CareerInfoGroup> = {
  title: 'Feature/Profile/CareerInfoGroup',
  component: CareerInfoGroup,
  tags: ['autodocs'],
  args: {
    // Add default args here based on component props
    data: {},
    onSave: async () => {
      await new Promise(r => setTimeout(r, 1000))
    }
  },
}

export default meta
type Story = StoryObj<typeof CareerInfoGroup>

export const Default: Story = {}
