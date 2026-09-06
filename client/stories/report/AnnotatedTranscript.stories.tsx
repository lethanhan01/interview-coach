import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import AnnotatedTranscript from '../../components/report/AnnotatedTranscript'
import {
  mockUnifiedReport,
  mockLegacyReport,
  mockSkippedTurnsReport,
} from '../../tests/fixtures/report.fixture'

const meta: Meta<typeof AnnotatedTranscript> = {
  title: 'Feature/Report/AnnotatedTranscript',
  component: AnnotatedTranscript,
  tags: ['autodocs'],
  args: {
    items: mockUnifiedReport.transcript,
  },
}

export default meta
type Story = StoryObj<typeof AnnotatedTranscript>

export const Default: Story = {}

export const UnifiedTurns: Story = {
  args: {
    items: mockUnifiedReport.transcript,
  },
}

export const SkippedTurn: Story = {
  args: {
    items: mockSkippedTurnsReport.transcript,
  },
}

export const LegacyFallback: Story = {
  args: {
    items: mockLegacyReport.transcript,
  },
}
