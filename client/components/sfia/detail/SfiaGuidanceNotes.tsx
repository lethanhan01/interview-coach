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
                <IconBulb size={15} stroke={1.5} />
              </ThemeIcon>
              <Stack gap={2}>
                <Text size="sm" fw={700}>
                  Ghi chú Hướng dẫn SFIA Foundation (Guidance Notes)
                </Text>
                <Text size="sm" c="dimmed">
                  Lưu ý ngữ cảnh áp dụng thực tế khi đánh giá kỹ năng{' '}
                  {skillName}
                </Text>
              </Stack>
            </Group>
          </Accordion.Control>

          <Accordion.Panel>
            <Paper
              withBorder
              p="xs"
              radius="sm"
              className={surfaces.subtleSurface}
            >
              <Group gap="xs" align="flex-start" wrap="nowrap">
                <ThemeIcon color="brand" variant="subtle" size="sm">
                  <IconInfoCircle size={15} stroke={1.5} />
                </ThemeIcon>
                <Text size="sm" lh={1.55} className={surfaces.preLine}>
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
