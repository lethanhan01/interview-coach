import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { WorkflowSection } from '@/components/landing/WorkflowSection'

const meta: Meta<typeof WorkflowSection> = {
  title: 'Feature/Landing/WorkflowSection',
  component: WorkflowSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
}

export default meta
type Story = StoryObj<typeof WorkflowSection>

export const Default: Story = {}
