'use client'

import { Group, Radio, SimpleGrid, Stack, Text } from '@mantine/core'
import { DURATION_OPTIONS } from '@/lib/setup-helpers'
import type { ContextPack, InterviewDuration, SessionType } from '@/types'
import interactions from '@/styles/interactions.module.css'

const SESSION_TYPES: {
  value: SessionType
  label: string
  description: string
}[] = [
  {
    value: 'hr',
    label: 'HR / Behavioral',
    description: 'Câu hỏi về kinh nghiệm, soft skills, và tình huống',
  },
  {
    value: 'technical',
    label: 'Technical',
    description: 'Câu hỏi kỹ thuật chuyên sâu theo JD',
  },
]

const CONTEXT_PACKS: { value: ContextPack; label: string; desc: string }[] = [
  {
    value: 'VN',
    label: 'Việt Nam',
    desc: 'Phong cách phỏng vấn Việt Nam, rubric phù hợp văn hóa địa phương',
  },
  {
    value: 'Western',
    label: 'Western',
    desc: 'STAR method, behavioral focus, phong cách công ty nước ngoài',
  },
]

export interface ConfigFormProps {
  sessionType: SessionType
  setSessionType: (v: SessionType) => void
  contextPack: ContextPack
  setContextPack: (v: ContextPack) => void
  duration: InterviewDuration
  setDuration: (v: InterviewDuration) => void
}

export default function ConfigForm({
  sessionType,
  setSessionType,
  contextPack,
  setContextPack,
  duration,
  setDuration,
}: Readonly<ConfigFormProps>) {
  return (
    <Stack gap="xl">
      <Radio.Group
        label="Loại phỏng vấn"
        value={sessionType}
        onChange={(val) => setSessionType(val as SessionType)}
      >
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mt="xs">
          {SESSION_TYPES.map((item) => (
            <Radio.Card
              key={item.value}
              value={item.value}
              radius="md"
              p="md"
              className={interactions.optionCard}
            >
              <Stack gap={6}>
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Text size="sm" fw={600}>
                    {item.label}
                  </Text>
                  <Radio.Indicator color="brand" />
                </Group>
                <Text size="xs" c="dimmed">
                  {item.description}
                </Text>
              </Stack>
            </Radio.Card>
          ))}
        </SimpleGrid>
      </Radio.Group>

      <Radio.Group
        label="Context Pack"
        value={contextPack}
        onChange={(val) => setContextPack(val as ContextPack)}
      >
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mt="xs">
          {CONTEXT_PACKS.map((item) => (
            <Radio.Card
              key={item.value}
              value={item.value}
              radius="md"
              p="md"
              className={interactions.optionCard}
            >
              <Stack gap={6}>
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Text size="sm" fw={600}>
                    {item.label}
                  </Text>
                  <Radio.Indicator color="brand" />
                </Group>
                <Text size="xs" c="dimmed">
                  {item.desc}
                </Text>
              </Stack>
            </Radio.Card>
          ))}
        </SimpleGrid>
      </Radio.Group>

      <Radio.Group
        label="Thời gian phỏng vấn"
        value={String(duration)}
        onChange={(val) => setDuration(Number(val) as InterviewDuration)}
      >
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" mt="xs">
          {DURATION_OPTIONS.map((item) => (
            <Radio.Card
              key={item.value}
              value={String(item.value)}
              radius="md"
              p="md"
              className={interactions.optionCard}
            >
              <Stack gap={6}>
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Text size="sm" fw={600}>
                    {item.label}
                  </Text>
                  <Radio.Indicator color="brand" />
                </Group>
                <Text size="xs" c="dimmed">
                  ~{item.numQuestions} câu hỏi
                </Text>
              </Stack>
            </Radio.Card>
          ))}
        </SimpleGrid>
      </Radio.Group>
    </Stack>
  )
}
