import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import CompetencyScoreChart from '../../components/report/CompetencyScoreChart'

const meta: Meta<typeof CompetencyScoreChart> = {
  title: 'Feature/Report/CompetencyScoreChart',
  component: CompetencyScoreChart,
  tags: ['autodocs'],
  args: {
    scores: {
      'D1': 85.5,
      'D2': 90,
      'TD1': 75.2
    }
  },
}

export default meta
type Story = StoryObj<typeof CompetencyScoreChart>

export const Default: Story = {}
