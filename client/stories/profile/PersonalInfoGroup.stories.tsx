import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import PersonalInfoGroup from '../../components/profile/PersonalInfoGroup'

const meta: Meta<typeof PersonalInfoGroup> = {
  title: 'Feature/Profile/PersonalInfoGroup',
  component: PersonalInfoGroup,
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
type Story = StoryObj<typeof PersonalInfoGroup>

export const Default: Story = {}
