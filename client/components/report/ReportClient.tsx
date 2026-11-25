'use client'

import { useParams } from 'next/navigation'
import {
  Alert,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { sessionQueries } from '@/queries/session.queries'
import AnnotatedTranscript from '@/components/report/transcript/AnnotatedTranscript'
import { SfiaCompetencyOverview } from '@/components/report/competency/SfiaCompetencyOverview'
import { SkillsBreakdownCard } from '@/components/report/competency/SkillsBreakdownCard'
import { ActionPlanTimeline } from '@/components/report/overview/ActionPlanTimeline'
import { ReportHeroSummary } from '@/components/report/overview/ReportHeroSummary'
import { ReportOverviewTab } from '@/components/report/overview/ReportOverviewTab'
import { BrandLogo } from '@/components/common/BrandLogo'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { SafeViewTransition } from '@/components/common/SafeViewTransition'
import { buildOverviewSummary } from './report-summary-helpers'
import { ReportNotReadyView } from './ReportNotReadyView'
import { useReportLoader } from './useReportLoader'

export interface ReportClientProps {
  sessionId?: string
}

export function ReportClient({
  sessionId: propSessionId,
}: Readonly<ReportClientProps> = {}) {
  const params = useParams<{ sessionId: string }>()
  const sessionId = propSessionId ?? params?.sessionId ?? ''
  const { data: session = null } = useQuery({
    ...sessionQueries.detail(sessionId),
    enabled: Boolean(sessionId),
  })

  const { report, progress, progressPercent, loading, error } =
    useReportLoader(sessionId)

  if (loading) {
    return (
      <ReportNotReadyView
        progress={progress}
        progressPercent={progressPercent}
      />
    )
  }

  if (error) {
    return (
      <Container size="md" py="xl">
        <Alert
          color="danger"
          variant="light"
          radius="md"
          icon={<IconAlertTriangle size={18} />}
          title="Lỗi tải báo cáo"
        >
          {error}
        </Alert>
      </Container>
    )
  }

  if (!report) return null

  const overviewSummary = buildOverviewSummary(report)

  return (
    <ErrorBoundary>
      <SafeViewTransition>
        <Container size="md" py="xl">
          <Stack gap="xl">
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Title order={1} size="h2">
                Báo cáo phỏng vấn
              </Title>
              <BrandLogo variant="lockup" size="sm" />
            </Group>

            <ReportHeroSummary report={report} />

            <ReportOverviewTab
              report={report}
              session={session}
              overviewSummary={overviewSummary}
            />

            {report.skillsBreakdown && report.skillsBreakdown.length > 0 ? (
              <>
                <SfiaCompetencyOverview skills={report.skillsBreakdown} />
                <SkillsBreakdownCard skills={report.skillsBreakdown} />
              </>
            ) : (
              <Paper
                withBorder
                radius="md"
                p="md"
                bg="var(--mantine-color-default)"
              >
                <Group gap="xs" mb={4}>
                  <IconInfoCircle
                    size={18}
                    color="var(--mantine-color-brand-filled)"
                    aria-hidden="true"
                  />
                  <Text size="sm" fw={700}>
                    Báo cáo phiên bản trước
                  </Text>
                </Group>
                <Text size="xs" c="dimmed" lh="relaxed">
                  Phiên phỏng vấn này được khởi tạo trước khi hệ thống nâng cấp
                  khung năng lực SFIA 9 &amp; O*NET. Điểm tổng quát và nội dung
                  chi tiết từng câu trả lời vẫn được bảo lưu đầy đủ bên dưới.
                </Text>
              </Paper>
            )}

            <ActionPlanTimeline actionPlan={report.actionPlan} />

            <Stack gap="xs">
              <Title order={2} size="h4">
                Phân tích từng câu trả lời
              </Title>
              <AnnotatedTranscript items={report.transcript ?? []} />
            </Stack>
          </Stack>
        </Container>
      </SafeViewTransition>
    </ErrorBoundary>
  )
}

export default ReportClient
