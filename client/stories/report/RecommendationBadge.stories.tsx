import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { RecommendationBadge } from '@/components/report/RecommendationBadge'

const meta: Meta<typeof RecommendationBadge> = {
  title: 'Feature/Report/RecommendationBadge',
  component: RecommendationBadge,
  tags: ['autodocs'],
  args: {
    status: 'recommended',
    size: 'md',
  },
}

export default meta
type Story = StoryObj<typeof RecommendationBadge>

export const Recommended: Story = {
  args: {
    status: 'recommended',
  },
}

export const StronglyRecommended: Story = {
  args: {
    status: 'strongly_recommended',
  },
}

export const Borderline: Story = {
  args: {
    status: 'borderline',
  },
}

export const NotRecommended: Story = {
  args: {
    status: 'not_recommended',
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 items-start">
      <div className="flex items-center gap-3">
        <span className="w-16 text-xs text-ink-muted">Small:</span>
        <RecommendationBadge status="strongly_recommended" size="sm" />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-16 text-xs text-ink-muted">Medium:</span>
        <RecommendationBadge status="strongly_recommended" size="md" />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-16 text-xs text-ink-muted">Large:</span>
        <RecommendationBadge status="strongly_recommended" size="lg" />
      </div>
    </div>
  ),
}

export const FallbackUndefined: Story = {
  args: {
    status: null,
  },
}
