import type { Meta, StoryObj } from '@storybook/react'
import AppSidebar from '@/components/layout/AppSidebar'
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider'

const meta: Meta<typeof AppSidebar> = {
  title: 'Layout/AppSidebar',
  component: AppSidebar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouterProvider url="/admin-dashboard">
        <div className="flex h-screen bg-surface-50">
          <Story />
          <main className="flex-1 p-8">Content Area</main>
        </div>
      </MemoryRouterProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof AppSidebar>

export const Admin: Story = {
  args: {
    role: 'admin',
    isMobile: false,
  },
}

export const Candidate: Story = {
  args: {
    role: 'candidate',
    isMobile: false,
  },
}

export const Mobile: Story = {
  args: {
    role: 'candidate',
    isMobile: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}
