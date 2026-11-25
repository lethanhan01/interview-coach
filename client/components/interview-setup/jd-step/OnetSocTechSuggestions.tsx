'use client'

import { Button, Group, Paper, Stack, Text } from '@mantine/core'
import { IconSparkles } from '@tabler/icons-react'
import type { OnetTech } from '@/types'

export interface OnetSocTechSuggestionsProps {
  suggestions: OnetTech[]
  occupationTitle?: string
  techStack: string[]
  onToggle: (tech: string) => void
}

export default function OnetSocTechSuggestions({
  suggestions,
  occupationTitle,
  techStack,
  onToggle,
}: Readonly<OnetSocTechSuggestionsProps>) {
  if (suggestions.length === 0) return null

  return (
    <Paper withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap={6} wrap="nowrap">
            <IconSparkles size={14} stroke={1.5} aria-hidden="true" />
            <Text size="xs" fw={600} c="brand">
              Gợi ý công nghệ O*NET cho {occupationTitle}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            Bấm để thêm nhanh vào Tech Stack
          </Text>
        </Group>

        <Group gap={6} wrap="wrap">
          {suggestions.map((tech) => {
            const selected = techStack.includes(tech.example)
            return (
              <Button
                key={tech.example}
                type="button"
                size="compact-xs"
                variant={selected ? 'filled' : 'light'}
                color="brand"
                aria-pressed={selected}
                onClick={() => onToggle(tech.example)}
              >
                {selected ? '✓ ' : '+ '}
                {tech.example}
              </Button>
            )
          })}
        </Group>
      </Stack>
    </Paper>
  )
}
