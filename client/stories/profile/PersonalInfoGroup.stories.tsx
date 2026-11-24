import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import PersonalInfoGroup from '@/components/profile/sections/PersonalInfoGroup'

const meta: Meta<typeof PersonalInfoGroup> = {
  title: 'Feature/Profile/PersonalInfoGroup',
  component: PersonalInfoGroup,
  tags: ['autodocs'],
  args: {
    data: {
      lastname: 'Nguyễn Văn',
      firstname: 'An',
    },
    onSave: async () => {
      await new Promise((resolve) => setTimeout(resolve, 400))
    },
  },
}

export default meta
type Story = StoryObj<typeof PersonalInfoGroup>

export const Default: Story = {}
