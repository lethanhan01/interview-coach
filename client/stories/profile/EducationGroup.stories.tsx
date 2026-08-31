import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import EducationGroup from '../../components/resume/EducationGroup'

const meta: Meta<typeof EducationGroup> = {
  title: 'Feature/Profile/EducationGroup',
  component: EducationGroup,
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
type Story = StoryObj<typeof EducationGroup>

export const Default: Story = {}
