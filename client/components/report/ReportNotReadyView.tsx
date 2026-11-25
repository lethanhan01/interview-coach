import { Card, Container, Loader, Progress, Stack, Text } from '@mantine/core'
import { BrandLogo } from '@/components/common/BrandLogo'
import type { FeedbackProgress } from '@/types'

export interface ReportNotReadyViewProps {
  progress: FeedbackProgress | null
  progressPercent: number
}

export function ReportNotReadyView({
  progress,
  progressPercent,
}: Readonly<ReportNotReadyViewProps>) {
  const feedbackRequired = progress?.feedbackRequired ?? 0
  const feedbackCompleted = progress?.feedbackCompleted ?? 0
  const feedbackPending = progress?.feedbackPending ?? 0
  const progressLabel = progress
    ? `Đã chấm ${feedbackCompleted}/${feedbackRequired} câu trả lời`
    : 'Đang kiểm tra tiến trình chấm điểm...'
  let detailLabel = 'Intervia AI đang chuẩn bị dữ liệu báo cáo.'
  if (progress) {
    detailLabel =
      feedbackPending > 0
        ? `Còn ${feedbackPending} câu đang xử lý`
        : 'Đang tổng hợp báo cáo...'
  }

  return (
    <Container size="xs" py="xl">
      <Card withBorder radius="md" p="xl" ta="center">
        <Stack align="center" gap="md">
          <BrandLogo variant="lockup" size="sm" />
          <Loader size="lg" color="brand" />
          <Stack gap="xs" w="100%">
            <Text size="sm" fw={600}>
              {progressLabel}
            </Text>
            <Progress
              value={progressPercent}
              color="brand"
              size="sm"
              radius="xl"
              aria-label={progressLabel}
            />
            <Text size="sm" c="dimmed">
              {detailLabel}
            </Text>
          </Stack>
        </Stack>
      </Card>
    </Container>
  )
}

export default ReportNotReadyView
