import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import CareerInfoGroup from '../../components/resume/CareerInfoGroup'

const meta: Meta<typeof CareerInfoGroup> = {
  title: 'Feature/Profile/CareerInfoGroup',
  component: CareerInfoGroup,
  tags: ['autodocs'],
  args: {
    data: {
      targetPosition: 'Software Developers',
      targetLevel: 'senior',
      onetSocCode: '15-1252.00',
      onetOccupationTitle: 'Software Developers',
      targetSfiaLevel: 4,
    },
    onSave: async () => {
      await new Promise((r) => setTimeout(r, 500))
    },
  },
}

export default meta
type Story = StoryObj<typeof CareerInfoGroup>

export const WithOnetData: Story = {}

export const Empty: Story = {
  args: {
    data: {},
  },
}
