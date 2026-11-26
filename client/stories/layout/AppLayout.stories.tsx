import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Paper, Stack, Text, Title } from '@mantine/core'
import AppLayout from '@/components/layout/AppLayout'

const meta: Meta<typeof AppLayout> = {
  title: 'Layout/AppLayout',
  component: AppLayout,
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
  args: {
    children: (
      <Paper withBorder p="xl" radius="md" mih={400}>
        <Stack align="center" justify="center" mih={320} gap="xs">
          <Title order={2}>Main Content Area</Title>
          <Text c="dimmed">
            This is where the page content will be rendered.
          </Text>
        </Stack>
      </Paper>
    ),
  },
}

export default meta
type Story = StoryObj<typeof AppLayout>

export const AdminLayout: Story = {
  args: {
    role: 'admin',
  },
}

export const CandidateLayout: Story = {
  args: {
    role: 'candidate',
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/sessions',
      },
    },
  },
}
