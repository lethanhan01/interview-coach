import {
  Alert,
  Badge,
  Box,
  Card,
  Group,
  Paper,
  Stack,
  Text,
} from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import type { AnnotatedSegment, TranscriptItem } from '@/types'
import { BinaryCriteriaChecklist } from './BinaryCriteriaChecklist'
import { TranscriptFeedbackSegments } from './TranscriptFeedbackSegments'
import classes from './AnnotatedTranscript.module.css'

export interface AnnotatedTranscriptProps {
  items?: TranscriptItem[]
  className?: string
}

function isStrengthSegment(segment: AnnotatedSegment) {
  const level = segment.highlightLevel.toLowerCase()
  return level === 'strength' || level === 'good'
}

export function AnnotatedTranscript({
  items = [],
  className,
}: Readonly<AnnotatedTranscriptProps>) {
  return (
    <Stack gap="lg" className={className}>
      {items.map((item) => {
        const strengthSegments = (item.segments ?? []).filter(isStrengthSegment)
        const improvementSegments = (item.segments ?? []).filter(
          (segment) => !isStrengthSegment(segment)
        )

        return (
          <Card key={item.orderIndex} withBorder radius="md" p="lg">
            <Stack gap="md">
              <Group justify="space-between" align="center" wrap="wrap">
                <Group gap="xs" wrap="wrap">
                  <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                    Câu {item.orderIndex}
                  </Text>
                  {item.demonstratedLevel != null && (
                    <Badge variant="outline" size="sm" ff="monospace">
                      SFIA Level {item.demonstratedLevel}
                    </Badge>
                  )}
                  {item.criteriaPassRate != null && (
                    <Badge
                      variant="light"
                      color={
                        item.criteriaPassRate >= 0.7 ? 'success' : 'warning'
                      }
                      size="sm"
                    >
                      Đạt {Math.round(item.criteriaPassRate * 100)}% tiêu chí
                    </Badge>
                  )}
                </Group>

                <Text size="xs" fw={700} c="brand">
                  {item.overallScore == null
                    ? 'Chưa thể chấm'
                    : `${item.overallScore.toFixed(1)} / 100`}
                </Text>
              </Group>

              <Text size="md" fw={600}>
                {item.questionText}
              </Text>

              {item.skipped ? (
                <Alert
                  color="warning"
                  variant="light"
                  radius="md"
                  icon={<IconAlertTriangle size={18} aria-hidden="true" />}
                  title="Câu hỏi này đã bị bỏ qua"
                >
                  <Text size="xs">
                    Ứng viên nhận 0 điểm và được đánh giá ở SFIA Level 1 theo
                    quy chuẩn chấm điểm tất định.
                  </Text>
                </Alert>
              ) : (
                <Paper
                  withBorder
                  radius="md"
                  p="md"
                  bg="var(--mantine-color-default)"
                >
                  <Text size="sm" lh="relaxed">
                    {item.answerText}
                  </Text>
                </Paper>
              )}

              {!item.skipped && item.keyTakeaway && (
                <Paper
                  withBorder
                  radius="md"
                  p="sm"
                  bg="var(--mantine-color-brand-light)"
                >
                  <Text size="xs">
                    <Text component="span" fw={700}>
                      Điểm chú ý:{' '}
                    </Text>
                    {item.keyTakeaway}
                  </Text>
                </Paper>
              )}

              {!item.skipped &&
                item.criteriaEvaluations &&
                item.criteriaEvaluations.length > 0 && (
                  <Stack gap="xs">
                    <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                      Tiêu chí thẩm định chuẩn hóa
                    </Text>
                    <BinaryCriteriaChecklist
                      criteria={item.criteriaEvaluations}
                    />
                  </Stack>
                )}

              {!item.skipped &&
                (!item.criteriaEvaluations ||
                  item.criteriaEvaluations.length === 0) && (
                  <Stack gap="xs">
                    <Paper
                      withBorder
                      radius="md"
                      p="sm"
                      bg="var(--mantine-color-default)"
                    >
                      <Text size="xs" c="dimmed">
                        Câu trả lời này thuộc phiên bản trước, không có dữ liệu
                        thẩm định tiêu chí SFIA 9 &amp; O*NET chi tiết.
                      </Text>
                    </Paper>

                    <TranscriptFeedbackSegments
                      strengthSegments={strengthSegments}
                      improvementSegments={improvementSegments}
                      answerText={item.answerText}
                    />
                  </Stack>
                )}

              {item.modelAnswer && (
                <Box component="details">
                  <Box component="summary" className={classes.summary}>
                    <Text
                      component="span"
                      size="xs"
                      fw={600}
                      c="brand"
                      tt="uppercase"
                    >
                      Xem câu trả lời đề xuất ▸
                    </Text>
                  </Box>
                  <Paper
                    withBorder
                    radius="md"
                    p="md"
                    mt="xs"
                    bg="var(--mantine-color-default)"
                  >
                    <Text size="sm" lh="relaxed">
                      {item.modelAnswer}
                    </Text>
                  </Paper>
                </Box>
              )}
            </Stack>
          </Card>
        )
      })}
    </Stack>
  )
}

export default AnnotatedTranscript
