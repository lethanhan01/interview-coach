import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CtaSection } from '@/components/landing/sections/CtaSection'

const meta: Meta<typeof CtaSection> = {
  title: 'Feature/Landing/CtaSection',
  component: CtaSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
}

export default meta
type Story = StoryObj<typeof CtaSection>

export const Default: Story = {}
