import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AppShell, Text } from '@mantine/core'
import AppSidebar from '@/components/layout/sidebar/AppSidebar'

const meta: Meta<typeof AppSidebar> = {
  title: 'Layout/AppSidebar',
  component: AppSidebar,
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
    (Story, context) => {
      const collapsed = Boolean(context.args.collapsed)
      return (
        <AppShell
          navbar={{ width: collapsed ? 72 : 260, breakpoint: 'xs' }}
          padding="md"
        >
          <AppShell.Navbar aria-label="Điều hướng chính">
            <Story />
          </AppShell.Navbar>
          <AppShell.Main>
            <Text c="dimmed">Content Area</Text>
          </AppShell.Main>
        </AppShell>
      )
    },
  ],
}

export default meta
type Story = StoryObj<typeof AppSidebar>

export const Admin: Story = {
  args: {
    role: 'admin',
    collapsed: false,
  },
}

export const AdminCollapsed: Story = {
  args: {
    role: 'admin',
    collapsed: true,
  },
}

export const Candidate: Story = {
  args: {
    role: 'candidate',
    collapsed: false,
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
