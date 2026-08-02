import type { Meta, StoryObj } from '@storybook/react'
import AppHeader from '@/components/layout/AppHeader'
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider'

const meta: Meta<typeof AppHeader> = {
  title: 'Layout/AppHeader',
  component: AppHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouterProvider url="/admin-dashboard">
        <div className="flex flex-col h-screen bg-surface-50">
          <Story />
          <main className="flex-1 p-8">Content Area</main>
        </div>
      </MemoryRouterProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof AppHeader>

export const AdminHeader: Story = {
  args: {
    role: 'admin',
    logoutActionSlot: <button className="w-full text-left text-sm text-red-500 p-2">Đăng xuất</button>
  },
}

export const CandidateHeader: Story = {
  args: {
    role: 'candidate',
    logoutActionSlot: <button className="w-full text-left text-sm text-red-500 p-2">Đăng xuất</button>
  },
}
