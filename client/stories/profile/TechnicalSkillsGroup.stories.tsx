import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import TechnicalSkillsGroup from '../../components/resume/TechnicalSkillsGroup'

const meta: Meta<typeof TechnicalSkillsGroup> = {
  title: 'Feature/Profile/TechnicalSkillsGroup',
  component: TechnicalSkillsGroup,
  tags: ['autodocs'],
  args: {
    data: [
      { id: '1', category: 'language', name: 'TypeScript', usagePeriod: 36 },
      { id: '2', category: 'framework', name: 'React', usagePeriod: 36 },
      { id: '3', category: 'framework', name: 'Next.js', usagePeriod: 24 },
      { id: '4', category: 'database', name: 'PostgreSQL', usagePeriod: 24 },
      { id: '5', category: 'platform', name: 'Docker', usagePeriod: 18 },
    ],
    onetSocCode: '15-1252.00',
    targetPosition: 'Software Developers',
    onSave: async () => {
      await new Promise((r) => setTimeout(r, 500))
    },
  },
}

export default meta
type Story = StoryObj<typeof TechnicalSkillsGroup>

export const WithSkillsAndOnet: Story = {}

export const Empty: Story = {
  args: {
    data: [],
    onetSocCode: undefined,
  },
}
