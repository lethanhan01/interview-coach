import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Group, Stack, Text } from '@mantine/core'
import { RecommendationBadge } from '@/components/report/overview/RecommendationBadge'

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
    <Stack align="flex-start" gap="md">
      <Group gap="sm">
        <Text size="xs" c="dimmed" miw={64}>
          Nhỏ:
        </Text>
        <RecommendationBadge status="strongly_recommended" size="sm" />
      </Group>
      <Group gap="sm">
        <Text size="xs" c="dimmed" miw={64}>
          Vừa:
        </Text>
        <RecommendationBadge status="strongly_recommended" size="md" />
      </Group>
      <Group gap="sm">
        <Text size="xs" c="dimmed" miw={64}>
          Lớn:
        </Text>
        <RecommendationBadge status="strongly_recommended" size="lg" />
      </Group>
    </Stack>
  ),
}

export const FallbackUndefined: Story = {
  args: {
    status: null,
  },
}
