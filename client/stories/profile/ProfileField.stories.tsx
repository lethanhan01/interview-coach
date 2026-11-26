import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Box } from '@mantine/core'
import ProfileField from '@/components/profile/primitives/ProfileField'

const meta: Meta<typeof ProfileField> = {
  title: 'Feature/Profile/ProfileField',
  component: ProfileField,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box component="dl">
        <Story />
      </Box>
    ),
  ],
  args: {
    label: 'Chuyên môn',
    value: 'Frontend Developer',
  },
}

export default meta
type Story = StoryObj<typeof ProfileField>

export const Default: Story = {}

export const Empty: Story = {
  args: {
    label: 'Ghi chú',
    value: undefined,
  },
}
