import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Text } from '@mantine/core'
import ProfileSection from '@/components/profile/primitives/ProfileSection'

const meta: Meta<typeof ProfileSection> = {
  title: 'Feature/Profile/ProfileSection',
  component: ProfileSection,
  tags: ['autodocs'],
  args: {
    title: 'Kinh nghiệm làm việc',
    children: <Text size="sm">Nội dung section...</Text>,
  },
}

export default meta
type Story = StoryObj<typeof ProfileSection>

export const Default: Story = {}
