import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import TechnicalSkillsGroup from '../../components/resume/TechnicalSkillsGroup'

const meta: Meta<typeof TechnicalSkillsGroup> = {
  title: 'Feature/Profile/TechnicalSkillsGroup',
  component: TechnicalSkillsGroup,
  tags: ['autodocs'],
  args: {
    data: [],
    onSave: async () => {
      await new Promise(r => setTimeout(r, 1000))
    }
  },
}

export default meta
type Story = StoryObj<typeof TechnicalSkillsGroup>

export const Default: Story = {}
