import {
  Alert,
  Badge,
  Card,
  Group,
  List,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconCircleCheck,
  IconInfoCircle,
} from '@tabler/icons-react'
import type { Report, Session } from '@/types'
import SessionMetadataCard from './SessionMetadataCard'
import { ScoringMethodCard } from './ScoringMethodCard'
import {
  GOOD_ANSWER_THRESHOLD,
  type OverviewSummary,
  WEAK_ANSWER_THRESHOLD,
} from '@/components/report/report-summary-helpers'

export interface ReportOverviewTabProps {
  report: Report
  session: Session | null
  overviewSummary: OverviewSummary
}

export function ReportOverviewTab({
  report,
  session,
  overviewSummary,
}: Readonly<ReportOverviewTabProps>) {
  return (
    <Stack gap="md">
      {report.reportQuality === 'partial' && (
        <Alert
          color="warning"
          variant="light"
          radius="md"
          icon={<IconAlertCircle size={18} aria-hidden="true" />}
        >
          <Text size="sm">
            Một số câu trả lời không được AI chấm điểm tự động. Điểm tổng vẫn
            tính các câu đã bỏ qua là 0 điểm.
          </Text>
        </Alert>
      )}

      {report.reportQuality === 'not_scorable' && (
        <Alert
          color="brand"
          variant="light"
          radius="md"
          icon={<IconInfoCircle size={18} aria-hidden="true" />}
        >
          <Text size="sm">
            Báo cáo cũ này chưa có dữ liệu điểm cho các câu đã bỏ qua. Các báo
            cáo mới sẽ tính câu bỏ qua là 0 điểm.
          </Text>
        </Alert>
      )}

      {session && <SessionMetadataCard session={session} />}

      <Card withBorder radius="md" p="lg">
        <Stack gap="md">
          <Title order={2} size="h5">
            Tóm tắt tổng quan
          </Title>

          <Stack gap="xs">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              Nhận xét tổng quan
            </Text>
            <Paper
              withBorder
              radius="sm"
              p="sm"
              bg="var(--mantine-color-default)"
            >
              <Text size="sm" lh="relaxed">
                {overviewSummary.overview}
              </Text>
            </Paper>
          </Stack>

          <Stack gap="xs">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              Các câu trả lời tốt
            </Text>
            {overviewSummary.goodAnswers.length > 0 ? (
              <List
                spacing="xs"
                size="sm"
                icon={
                  <ThemeIcon color="success" size={18} radius="xl">
                    <IconCircleCheck size={12} aria-hidden="true" />
                  </ThemeIcon>
                }
              >
                {overviewSummary.goodAnswers.map((item) => (
                  <List.Item key={item.label}>
                    <Text component="span" size="sm">
                      {item.label} - {item.score}/100
                    </Text>
                  </List.Item>
                ))}
              </List>
            ) : (
              <Text size="sm" c="dimmed">
                Chưa có câu trả lời nào đạt từ {GOOD_ANSWER_THRESHOLD}/100.
              </Text>
            )}
          </Stack>

          <Stack gap="xs">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              Các câu trả lời không tốt
            </Text>
            {overviewSummary.weakAnswers.length > 0 ? (
              <List
                spacing="xs"
                size="sm"
                icon={
                  <ThemeIcon color="warning" size={18} radius="xl">
                    <IconAlertCircle size={12} aria-hidden="true" />
                  </ThemeIcon>
                }
              >
                {overviewSummary.weakAnswers.map((item) => (
                  <List.Item key={item.label}>
                    <Text component="span" size="sm">
                      {item.label} - {item.score}/100
                    </Text>
                  </List.Item>
                ))}
              </List>
            ) : (
              <Text size="sm" c="dimmed">
                Không có câu trả lời nào dưới {WEAK_ANSWER_THRESHOLD}/100.
              </Text>
            )}
          </Stack>

          <Stack gap="xs">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              Hướng cần cải thiện
            </Text>
            {overviewSummary.improvementDirections.length > 0 ? (
              <Group gap="xs" wrap="wrap">
                {overviewSummary.improvementDirections.map((item) => (
                  <Badge key={item} variant="light" color="brand" size="md">
                    {item}
                  </Badge>
                ))}
              </Group>
            ) : (
              <Text size="sm" c="dimmed">
                Chưa có đủ dữ liệu để tổng hợp hướng cải thiện.
              </Text>
            )}
          </Stack>
        </Stack>
      </Card>

      {session?.contextPackId && session?.sessionType && (
        <ScoringMethodCard
          contextPackId={session.contextPackId}
          sessionType={session.sessionType}
        />
      )}
    </Stack>
  )
}

export default ReportOverviewTab
