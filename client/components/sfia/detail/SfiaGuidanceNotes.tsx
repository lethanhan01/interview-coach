'use client'

import { Accordion, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconBulb, IconInfoCircle } from '@tabler/icons-react'
import surfaces from '@/styles/surfaces.module.css'

export interface SfiaGuidanceNotesProps {
  guidanceNotes?: string
  skillName: string
  className?: string
}

export function SfiaGuidanceNotes({
  guidanceNotes,
  skillName,
  className,
}: Readonly<SfiaGuidanceNotesProps>) {
  if (!guidanceNotes) return null

  return (
    <Paper withBorder radius="md" className={className}>
      <Accordion defaultValue="guidance" radius="md">
        <Accordion.Item value="guidance">
          <Accordion.Control>
            <Group gap="xs" align="center">
              <ThemeIcon color="warning" variant="light" size="sm" radius="sm">
                <IconBulb size={14} stroke={1.5} />
              </ThemeIcon>
              <Stack gap={2}>
                <Text size="xs" fw={700}>
                  Ghi chú Hướng dẫn SFIA Foundation (Guidance Notes)
                </Text>
                <Text size="xs" c="dimmed">
                  Lưu ý ngữ cảnh áp dụng thực tế khi đánh giá kỹ năng{' '}
                  {skillName}
                </Text>
              </Stack>
            </Group>
          </Accordion.Control>

          <Accordion.Panel>
            <Paper
              withBorder
              p="sm"
              radius="sm"
              className={surfaces.subtleSurface}
            >
              <Group gap="xs" align="flex-start" wrap="nowrap">
                <ThemeIcon color="brand" variant="subtle" size="xs">
                  <IconInfoCircle size={14} stroke={1.5} />
                </ThemeIcon>
                <Text size="xs" lh={1.5} className={surfaces.preLine}>
                  {guidanceNotes}
                </Text>
              </Group>
            </Paper>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Paper>
  )
}
