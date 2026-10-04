import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import PersonalityGroup from '../../components/resume/PersonalityGroup'

const meta: Meta<typeof PersonalityGroup> = {
  title: 'Feature/Profile/PersonalityGroup',
  component: PersonalityGroup,
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
type Story = StoryObj<typeof PersonalityGroup>

export const Default: Story = {}
