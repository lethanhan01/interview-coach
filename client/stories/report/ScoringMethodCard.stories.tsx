import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import ScoringMethodCard from '../../components/report/ScoringMethodCard'

const meta: Meta<typeof ScoringMethodCard> = {
  title: 'Feature/Report/ScoringMethodCard',
  component: ScoringMethodCard,
  tags: ['autodocs'],
  args: {
    contextPackId: 'VN',
    sessionType: 'hr',
  },
}

export default meta
type Story = StoryObj<typeof ScoringMethodCard>

export const Default: Story = {}
