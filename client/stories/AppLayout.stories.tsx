import type { Meta, StoryObj } from '@storybook/react'
import AppLayout from '@/components/layout/AppLayout'

const meta: Meta<typeof AppLayout> = {
  title: 'Layout/AppLayout',
  component: AppLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    children: (
      <div className="p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold text-ink">Main Content Area</h2>
        <p className="text-ink-muted mt-2">This is where the page content will be rendered.</p>
      </div>
    ),
  }
}

export default meta
type Story = StoryObj<typeof AppLayout>

export const AdminLayout: Story = {
  args: {
    role: 'admin',
    logoutActionSlot: <button className="w-full text-left text-sm text-red-500 p-2 hover:bg-surface-sunken">Đăng xuất</button>
  },
}

export const CandidateLayout: Story = {
  args: {
    role: 'candidate',
    logoutActionSlot: <button className="w-full text-left text-sm text-red-500 p-2 hover:bg-surface-sunken">Đăng xuất</button>
  },
}
