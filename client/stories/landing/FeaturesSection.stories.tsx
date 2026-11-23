import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FeaturesSection } from '@/components/landing/FeaturesSection'

const meta: Meta<typeof FeaturesSection> = {
  title: 'Feature/Landing/FeaturesSection',
  component: FeaturesSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
}

export default meta
type Story = StoryObj<typeof FeaturesSection>

export const Default: Story = {}
