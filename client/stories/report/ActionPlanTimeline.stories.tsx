import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ActionPlanTimeline } from '@/components/report/ActionPlanTimeline'
import {
  mockUnifiedActionPlan,
  mockLegacyReport,
} from '@/tests/fixtures/report.fixture'

const meta: Meta<typeof ActionPlanTimeline> = {
  title: 'Feature/Report/ActionPlanTimeline',
  component: ActionPlanTimeline,
  tags: ['autodocs'],
  args: {
    actionPlan: { actionPlan: mockUnifiedActionPlan },
  },
}

export default meta
type Story = StoryObj<typeof ActionPlanTimeline>

export const StructuredPlan: Story = {
  args: {
    actionPlan: { actionPlan: mockUnifiedActionPlan },
  },
}

export const LegacyStringItems: Story = {
  args: {
    actionPlan: mockLegacyReport.actionPlan,
  },
}
