import type { Meta, StoryObj } from '@storybook/react'
import ProjectsGroup from '../../components/profile/ProjectsGroup'

const meta: Meta<typeof ProjectsGroup> = {
  title: 'Feature/Profile/ProjectsGroup',
  component: ProjectsGroup,
  tags: ['autodocs'],
  args: {
    data: [],
    onSave: async () => {
      await new Promise(r => setTimeout(r, 1000))
    }
  },
}

export default meta
type Story = StoryObj<typeof ProjectsGroup>

export const Default: Story = {}
