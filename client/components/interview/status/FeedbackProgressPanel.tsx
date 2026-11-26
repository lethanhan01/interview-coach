'use client'

import Link from 'next/link'
import {
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  Progress,
  Stack,
  Text,
  Timeline,
  Title,
} from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import {
  IconArrowLeft,
  IconCheck,
  IconClipboardCheck,
  IconSparkles,
} from '@tabler/icons-react'
import type { FeedbackProgress } from '@/types'

export interface FeedbackProgressPanelProps {
  progress: FeedbackProgress | null
  title?: string
  description?: string
  isTimeoutCompleting?: boolean
  backHref?: string
  backLabel?: string
}

function getProgressPercent(progress: FeedbackProgress | null): number {
  if (!progress) return 0
  if (progress.feedbackRequired === 0) return 100
  return Math.min(
    100,
    Math.round((progress.feedbackCompleted / progress.feedbackRequired) * 100)
  )
}

export default function FeedbackProgressPanel({
  progress,
  title,
  description,
  isTimeoutCompleting = false,
  backHref,
  backLabel = 'Quay lại danh sách phiên',
}: Readonly<FeedbackProgressPanelProps>) {
  const reduceMotion = useReducedMotion()
  const progressPercent = getProgressPercent(progress)
  const feedbackRequired = progress?.feedbackRequired ?? 0
  const feedbackCompleted = progress?.feedbackCompleted ?? 0
  const feedbackPending = progress?.feedbackPending ?? 0

  const resolvedTitle =
    title ??
    (isTimeoutCompleting
      ? 'Đã hết thời gian, đang hoàn tất phiên phỏng vấn'
      : 'Đang hoàn tất phiên phỏng vấn')

  const progressLabel = progress
    ? `Đã chấm ${feedbackCompleted}/${feedbackRequired} câu trả lời`
    : 'Đang kiểm tra tiến trình chấm điểm...'

  const detailLabel =
    description ??
    (isTimeoutCompleting
      ? 'Các câu chưa trả lời sẽ được đánh dấu bỏ qua trước khi tạo báo cáo.'
      : progress
        ? feedbackPending > 0
          ? `Còn ${feedbackPending} câu đang xử lý`
          : 'Đang tổng hợp báo cáo...'
        : 'AI đang chuẩn bị dữ liệu báo cáo.')

  const activeTimelineStep = progress
    ? progress.reportReady || feedbackPending === 0
      ? 2
      : 1
    : 0

  return (
    <Paper withBorder radius="md" p="xl">
      <Stack align="center" gap="lg">
        <Loader color="brand" size="md" aria-hidden="true" />

        <Stack gap={4} align="center">
          <Title order={2} size="h4" ta="center">
            {resolvedTitle}
          </Title>
          <Text size="sm" c="dimmed" ta="center">
            {detailLabel}
          </Text>
        </Stack>

        <Stack gap="xs" w="100%">
          <Group justify="space-between" align="center">
            <Text size="sm" fw={600}>
              {progressLabel}
            </Text>
            <Badge variant="light" color="brand" size="sm">
              {progressPercent}%
            </Badge>
          </Group>

          <Progress
            value={progressPercent}
            color="brand"
            size="md"
            radius="xl"
            animated={!reduceMotion && progressPercent < 100}
            aria-label={progressLabel}
          />
        </Stack>

        <Timeline
          active={activeTimelineStep}
          bulletSize={24}
          lineWidth={2}
          w="100%"
        >
          <Timeline.Item
            bullet={<IconCheck size={14} stroke={1.5} aria-hidden="true" />}
            title="Hoàn tất & lưu bài trả lời"
          >
            <Text size="xs" c="dimmed">
              Toàn bộ câu trả lời đã được ghi nhận an toàn.
            </Text>
          </Timeline.Item>

          <Timeline.Item
            bullet={<IconSparkles size={14} stroke={1.5} aria-hidden="true" />}
            title="AI chấm điểm chi tiết từng câu"
          >
            <Text size="xs" c="dimmed">
              {progressLabel}
            </Text>
          </Timeline.Item>

          <Timeline.Item
            bullet={
              <IconClipboardCheck size={14} stroke={1.5} aria-hidden="true" />
            }
            title="Tổng hợp báo cáo năng lực STAR & SFIA"
          >
            <Text size="xs" c="dimmed">
              {activeTimelineStep >= 2
                ? 'Đang hoàn thiện điểm tổng hợp và lộ trình cải thiện.'
                : 'Tự động mở báo cáo ngay khi hoàn tất.'}
            </Text>
          </Timeline.Item>
        </Timeline>

        {backHref ? (
          <Button
            component={Link}
            href={backHref}
            transitionTypes={['nav-back']}
            variant="subtle"
            color="neutral"
            size="sm"
            leftSection={
              <IconArrowLeft size={16} stroke={1.5} aria-hidden="true" />
            }
          >
            {backLabel}
          </Button>
        ) : null}
      </Stack>
    </Paper>
  )
}
