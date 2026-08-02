import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import WorkExperienceGroup from '../../components/profile/WorkExperienceGroup'

const meta: Meta<typeof WorkExperienceGroup> = {
  title: 'Feature/Profile/WorkExperienceGroup',
  component: WorkExperienceGroup,
  tags: ['autodocs'],
  args: {
    data: [],
    onSave: async () => {
      await new Promise(r => setTimeout(r, 1000))
    }
  },
}

export default meta
type Story = StoryObj<typeof WorkExperienceGroup>

export const Default: Story = {}
