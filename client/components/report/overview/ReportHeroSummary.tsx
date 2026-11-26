import { Badge, Group, Paper, Stack, Text } from '@mantine/core'
import type { Report } from '@/types'
import { RecommendationBadge } from './RecommendationBadge'
import { getReportRecommendationStatus } from '@/components/report/report-summary-helpers'

export interface ReportHeroSummaryProps {
  report: Report
}

export function ReportHeroSummary({
  report,
}: Readonly<ReportHeroSummaryProps>) {
  const recommendationStatus = getReportRecommendationStatus(report)
  const targetSfia = report.executiveSummary?.targetSfiaLevel
  const demonstratedSfia = report.executiveSummary?.demonstratedSfiaLevel

  return (
    <Paper withBorder radius="md" p="lg" bg="var(--mantine-color-brand-light)">
      <Group justify="space-between" align="center" wrap="wrap" gap="lg">
        <Stack gap="xs">
          <Text size="xs" fw={700} tt="uppercase" c="brand">
            Điểm đánh giá tổng kết
          </Text>

          {report.overallScore == null ? (
            <Stack gap={2}>
              <Text size="xl" fw={700}>
                Chưa thể chấm điểm
              </Text>
              <Text size="xs" c="dimmed">
                {report.reportQuality === 'not_scorable'
                  ? 'Phiên này chưa có câu trả lời nào để chấm điểm.'
                  : 'Dịch vụ AI tạm thời chưa khả dụng. Câu trả lời của bạn vẫn đã được lưu.'}
              </Text>
            </Stack>
          ) : (
            <Group align="baseline" gap="xs">
              <Text size="3rem" fw={800} lh={1}>
                {report.overallScore.toFixed(1)}
              </Text>
              <Text size="lg" fw={600} c="dimmed">
                / 100
              </Text>
            </Group>
          )}

          {(targetSfia || demonstratedSfia != null) && (
            <Group gap="xs" wrap="wrap">
              {targetSfia && (
                <Badge variant="outline" size="sm" color="brand">
                  Kỳ vọng:{' '}
                  <Text component="span" fw={700}>
                    SFIA Level {targetSfia}
                  </Text>
                </Badge>
              )}
              {demonstratedSfia != null && (
                <Badge variant="outline" size="sm" color="brand">
                  Thể hiện:{' '}
                  <Text component="span" fw={700}>
                    {demonstratedSfia > 0
                      ? `SFIA Level ${demonstratedSfia}`
                      : 'Chưa thể hiện (Level 0)'}
                  </Text>
                </Badge>
              )}
            </Group>
          )}
        </Stack>

        {recommendationStatus && (
          <Stack gap={4} align="flex-end">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              Khuyến nghị tuyển dụng
            </Text>
            <RecommendationBadge status={recommendationStatus} size="lg" />
          </Stack>
        )}
      </Group>
    </Paper>
  )
}

export default ReportHeroSummary
