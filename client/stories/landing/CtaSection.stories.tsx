import type { Meta, StoryObj } from '@storybook/react'
import { CtaSection } from '../../components/landing/CtaSection'

const meta: Meta<typeof CtaSection> = {
  title: 'Feature/Landing/CtaSection',
  component: CtaSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof CtaSection>

export const Default: Story = {}
