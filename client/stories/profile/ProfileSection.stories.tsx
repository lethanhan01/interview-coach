import type { Meta, StoryObj } from '@storybook/react'
import ProfileSection from '../../components/profile/ProfileSection'

const meta: Meta<typeof ProfileSection> = {
  title: 'Feature/Profile/ProfileSection',
  component: ProfileSection,
  tags: ['autodocs'],
  args: {
    title: 'Kinh nghiệm làm việc',
    children: <div>Nội dung section...</div>,
  },
}

export default meta
type Story = StoryObj<typeof ProfileSection>

export const Default: Story = {}
