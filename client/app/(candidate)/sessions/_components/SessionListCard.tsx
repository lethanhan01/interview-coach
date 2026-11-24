'use client'

import Link from 'next/link'
import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Paper,
  RingProgress,
  Stack,
  Text,
} from '@mantine/core'
import { IconClock } from '@tabler/icons-react'
import { formatVietnamDateTime } from '@/lib/date-time'
import type { Session, SessionStatus } from '@/types'
import classes from './SessionListCard.module.css'

type SemanticColor = 'brand' | 'success' | 'warning' | 'danger' | 'neutral'

const SESSION_TYPE_LABELS: Record<string, string> = {
  hr: 'HR / Behavioral',
  technical: 'Technical',
}

const STATUS_META: Record<
  SessionStatus,
  { label: string; color: SemanticColor }
> = {
  active: { label: 'Đang phỏng vấn', color: 'brand' },
  paused: { label: 'Tạm dừng', color: 'warning' },
  ready: { label: 'Sẵn sàng', color: 'brand' },
  completing: { label: 'Đang tạo báo cáo', color: 'warning' },
  completed: { label: 'Hoàn thành', color: 'success' },
  canceled: { label: 'Đã hủy', color: 'danger' },
  generating: { label: 'Đang tạo...', color: 'warning' },
  error: { label: 'Lỗi', color: 'danger' },
}

export function getCompanyName(jobDescription: string): string | undefined {
  const line = jobDescription
    .split(/\r?\n/)
    .find((item) => item.trim().startsWith('Tên công ty:'))
  if (!line) return undefined
  return line.slice(line.indexOf(':') + 1).trim() || undefined
}

export function getScoreColor(score: number): SemanticColor {
  if (score >= 70) return 'success'
  if (score >= 50) return 'warning'
  return 'danger'
}

export interface SessionListCardProps {
  session: Session
}

export default function SessionListCard({
  session,
}: Readonly<SessionListCardProps>) {
  const statusInfo = STATUS_META[session.status] ?? {
    label: session.status,
    color: 'neutral' as const,
  }
  const company = getCompanyName(session.jobDescription)
  const hasScore =
    session.status === 'completed' && session.overallScore != null
  const clampedScore = hasScore
    ? Math.min(100, Math.max(0, session.overallScore!))
    : 0
  const scoreColor = getScoreColor(clampedScore)

  return (
    <Card withBorder radius="md" p="lg" className={classes.card}>
      <Stack gap="md" flex={1}>
        <Group justify="space-between" align="flex-start" gap="xs" wrap="wrap">
          <Badge color={statusInfo.color} variant="light" size="sm">
            {statusInfo.label}
          </Badge>
          {session.createdAt ? (
            <Text size="xs" c="dimmed">
              {formatVietnamDateTime(session.createdAt)}
            </Text>
          ) : null}
        </Group>

        <Stack gap={2}>
          <Text fw={600} size="sm" lineClamp={2}>
            {session.jobTitle || '—'}
          </Text>
          {company ? (
            <Text size="xs" c="dimmed" truncate>
              {company}
            </Text>
          ) : null}
        </Stack>

        <Group gap={6} wrap="wrap">
          <Badge variant="outline" color="neutral" size="sm">
            {SESSION_TYPE_LABELS[session.sessionType] ?? session.sessionType}
          </Badge>
          <Badge variant="outline" color="neutral" size="sm">
            {session.contextPackId}
          </Badge>
          {session.durationMin != null ? (
            <Badge
              variant="light"
              color="neutral"
              size="sm"
              leftSection={
                <IconClock size={12} stroke={1.5} aria-hidden="true" />
              }
            >
              {session.durationMin} phút
            </Badge>
          ) : null}
        </Group>

        {hasScore ? (
          <Paper withBorder radius="md" p="sm" className={classes.scoreBox}>
            <Group gap="md" wrap="nowrap">
              <RingProgress
                size={56}
                thickness={5}
                roundCaps
                sections={[{ value: clampedScore, color: scoreColor }]}
                label={
                  <Text
                    ta="center"
                    fz="xs"
                    fw={700}
                    className={classes.tabular}
                  >
                    {Math.round(clampedScore)}
                  </Text>
                }
              />
              <Stack gap={2}>
                <Text size="xs" c="dimmed" fw={500}>
                  Điểm tổng
                </Text>
                <Text
                  size="lg"
                  fw={700}
                  c={scoreColor}
                  className={classes.tabular}
                >
                  {session.overallScore}/100
                </Text>
              </Stack>
            </Group>
          </Paper>
        ) : null}
      </Stack>

      <Stack gap="sm" mt="md">
        <Divider />
        {session.status === 'completed' ? (
          <Button
            component={Link}
            href={`/sessions/${session.id}/report`}
            transitionTypes={['nav-forward']}
            color="brand"
            size="sm"
            fullWidth
          >
            Xem báo cáo
          </Button>
        ) : null}

        {session.status === 'completing' ? (
          <Button
            component={Link}
            href={`/sessions/${session.id}/report`}
            transitionTypes={['nav-forward']}
            variant="light"
            color="brand"
            size="sm"
            fullWidth
          >
            Theo dõi báo cáo
          </Button>
        ) : null}

        {session.status === 'active' ||
        session.status === 'ready' ||
        session.status === 'paused' ? (
          <Button
            component={Link}
            href={`/sessions/${session.id}`}
            transitionTypes={['nav-forward']}
            color="brand"
            size="sm"
            fullWidth
          >
            {session.status === 'ready' ? 'Bắt đầu' : 'Tiếp tục'}
          </Button>
        ) : null}

        {session.status === 'generating' ? (
          <Button
            component={Link}
            href={`/sessions/${session.id}`}
            transitionTypes={['nav-forward']}
            variant="light"
            color="warning"
            size="sm"
            fullWidth
          >
            Xem tiến độ
          </Button>
        ) : null}

        {session.status === 'canceled' || session.status === 'error' ? (
          <Text size="xs" c="dimmed" ta="center" py={4}>
            {session.status === 'canceled'
              ? 'Phiên đã bị hủy'
              : 'Phiên gặp lỗi trong quá trình xử lý'}
          </Text>
        ) : null}
      </Stack>
    </Card>
  )
}
