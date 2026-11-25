'use client'

import {
  Alert,
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { formatVietnamDateTime } from '@/lib/date-time'
import {
  getContextPackLabel,
  getSessionTypeLabel,
} from '@/lib/interview-option-helpers'
import { catalogQueries } from '@/queries/catalog.queries'
import type { Session } from '@/types'
import { parseJobDescription } from './parse-session-jd'
import { SessionJdDetails } from './SessionJdDetails'

export interface SessionMetadataCardProps {
  session: Session
  className?: string
}

function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack gap={2}>
      <Text size="xs" fw={600} tt="uppercase" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {value}
      </Text>
    </Stack>
  )
}

export function SessionMetadataCard({
  session,
  className,
}: Readonly<SessionMetadataCardProps>) {
  const catalogQuery = useQuery(catalogQueries.interviewOptions())
  const sessionTypes = catalogQuery.data?.sessionTypes ?? []
  const contextPacks = catalogQuery.data?.contextPacks ?? []

  const parsedJd = parseJobDescription(session.jobDescription)
  const sessionTypeLabel = session.sessionType
    ? getSessionTypeLabel(session.sessionType, sessionTypes, 'shortLabel')
    : '—'
  const contextPackLabel = session.contextPackId
    ? getContextPackLabel(session.contextPackId, contextPacks)
    : '—'

  return (
    <Card withBorder radius="md" p="lg" className={className}>
      <Stack gap="md">
        <Title order={2} size="h4">
          Thông tin phiên phỏng vấn
        </Title>

        {catalogQuery.isError ? (
          <Alert
            color="danger"
            variant="light"
            icon={
              <IconAlertTriangle size={16} stroke={1.5} aria-hidden="true" />
            }
          >
            <Group justify="space-between" align="center" wrap="wrap" gap="xs">
              <Text size="xs">
                Không thể tải danh mục nhãn phiên phỏng vấn. Đang hiển thị mã
                gốc.
              </Text>
              <Button
                size="xs"
                variant="light"
                color="danger"
                onClick={() => void catalogQuery.refetch()}
              >
                Thử lại
              </Button>
            </Group>
          </Alert>
        ) : null}

        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
          <MetaItem label="Vị trí ứng tuyển" value={session.jobTitle || '—'} />
          <MetaItem label="Loại phỏng vấn" value={sessionTypeLabel} />
          <MetaItem label="Bối cảnh" value={contextPackLabel} />
          <MetaItem
            label="Số câu hỏi"
            value={`${session.numQuestions || '—'} câu`}
          />
          <MetaItem
            label="Thời lượng"
            value={`${session.durationMin || '—'} phút`}
          />
          <MetaItem
            label="Thời gian hoàn tất"
            value={formatVietnamDateTime(
              session.completedAt || session.createdAt
            )}
          />
        </SimpleGrid>

        {session.jobDescription ? (
          <SessionJdDetails
            parsedJd={parsedJd}
            fallbackJobTitle={session.jobTitle ?? undefined}
          />
        ) : null}
      </Stack>
    </Card>
  )
}

export default SessionMetadataCard
