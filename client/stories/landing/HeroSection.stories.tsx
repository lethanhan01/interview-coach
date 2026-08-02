import type { Meta, StoryObj } from '@storybook/react'
import { HeroSection } from '../../components/landing/HeroSection'

const meta: Meta<typeof HeroSection> = {
  title: 'Feature/Landing/HeroSection',
  component: HeroSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof HeroSection>

export const Default: Story = {}
