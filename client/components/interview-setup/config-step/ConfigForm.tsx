'use client'

import {
  Alert,
  Button,
  Group,
  Radio,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { catalogQueries } from '@/queries/catalog.queries'
import type { ContextPack, InterviewDuration, SessionType } from '@/types'
import interactions from '@/styles/interactions.module.css'

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
  const catalogQuery = useQuery(catalogQueries.interviewOptions())

  if (catalogQuery.isPending) {
    return (
      <Stack gap="xl" aria-busy="true">
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Loại phỏng vấn
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <Skeleton height={84} radius="md" />
            <Skeleton height={84} radius="md" />
          </SimpleGrid>
        </Stack>
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Context Pack
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <Skeleton height={84} radius="md" />
            <Skeleton height={84} radius="md" />
          </SimpleGrid>
        </Stack>
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Thời gian phỏng vấn
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
            <Skeleton height={72} radius="md" />
            <Skeleton height={72} radius="md" />
            <Skeleton height={72} radius="md" />
          </SimpleGrid>
        </Stack>
      </Stack>
    )
  }

  if (catalogQuery.isError) {
    return (
      <Alert
        color="danger"
        variant="light"
        role="alert"
        title="Không thể tải danh mục cấu hình"
        icon={<IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />}
      >
        <Stack gap="sm" align="flex-start">
          <Text size="sm">
            Không thể tải danh sách loại phỏng vấn, context pack và thời lượng.
          </Text>
          <Button
            type="button"
            variant="light"
            color="danger"
            size="xs"
            onClick={() => void catalogQuery.refetch()}
          >
            Thử lại
          </Button>
        </Stack>
      </Alert>
    )
  }

  const { sessionTypes, contextPacks, durations } = catalogQuery.data

  return (
    <Stack gap="xl">
      <Radio.Group
        label="Loại phỏng vấn"
        value={sessionType}
        onChange={(val) => setSessionType(val as SessionType)}
      >
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mt="xs">
          {sessionTypes.map((item) => (
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
          {contextPacks.map((item) => (
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
        label="Thời gian phỏng vấn"
        value={String(duration)}
        onChange={(val) => setDuration(Number(val) as InterviewDuration)}
      >
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" mt="xs">
          {durations.map((item) => (
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
