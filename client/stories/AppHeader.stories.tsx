import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AppShell, Text } from '@mantine/core'
import AppHeader from '@/components/layout/AppHeader'

const meta: Meta<typeof AppHeader> = {
  title: 'Layout/AppHeader',
  component: AppHeader,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/admin/dashboard',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AppShell header={{ height: 60 }} padding="md">
        <AppShell.Header>
          <Story />
        </AppShell.Header>
        <AppShell.Main>
          <Text c="dimmed">Content Area</Text>
        </AppShell.Main>
      </AppShell>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof AppHeader>

export const AdminHeader: Story = {
  args: {
    role: 'admin',
  },
}

export const CandidateHeader: Story = {
  args: {
    role: 'candidate',
  },
}
