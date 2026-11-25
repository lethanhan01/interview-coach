'use client'

import {
  Alert,
  Badge,
  Divider,
  Group,
  Select,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconAward,
  IconBriefcase,
  IconSparkles,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import {
  getContextPackLabel,
  getJdLevelLabel,
  getSessionTypeLabel,
  mapJdLevelToSfia,
} from '@/lib/interview-option-helpers'
import { catalogQueries } from '@/queries/catalog.queries'
import type {
  ContextPack,
  InterviewDuration,
  JdFormData,
  SessionType,
} from '@/types'
import {
  CatalogErrorAlert,
  SummaryRow,
  SummarySection,
} from './ConfirmSummarySection'

export interface ConfirmStepProps {
  jd: JdFormData
  sessionType: SessionType
  contextPack: ContextPack
  duration: InterviewDuration
  error: string | null
  onChange?: (jd: JdFormData) => void
}

export default function ConfirmStep({
  jd,
  sessionType,
  contextPack,
  duration,
  error,
  onChange,
}: Readonly<ConfirmStepProps>) {
  const catalogQuery = useQuery(catalogQueries.interviewOptions())
  const catalog = catalogQuery.data
  const jdLevels = catalog?.jdLevels ?? []
  const sfiaLevels = catalog?.sfiaLevels ?? []
  const sfiaSelectData = sfiaLevels.map((l) => ({
    value: String(l.levelId),
    label: `L${l.levelId} — ${l.nameVi || l.name}`,
  }))

  const durationOpt = catalog?.durations.find((d) => d.value === duration)
  const currentSfiaLevel =
    jd.targetSfiaLevel ?? mapJdLevelToSfia(jd.level, jdLevels)
  const matchedSfia =
    currentSfiaLevel !== undefined
      ? sfiaLevels.find((l) => l.levelId === currentSfiaLevel)
      : undefined

  function handleSfiaChange(val: string | null) {
    if (!val || !onChange) return
    const levelNum = Number(val)
    if (!Number.isNaN(levelNum)) {
      onChange({ ...jd, targetSfiaLevel: levelNum })
    }
  }

  return (
    <Stack gap="lg">
      {catalogQuery.isError ? (
        <CatalogErrorAlert onRetry={() => void catalogQuery.refetch()} />
      ) : null}

      <SummarySection
        title="Hồ sơ Vị trí Tuyển dụng (AI Job Profile)"
        icon={<IconSparkles size={14} stroke={1.5} aria-hidden="true" />}
      >
        <SummaryRow label="Chức danh chuẩn O*NET">
          {jd.onetOccupationTitle ? (
            <Group gap="xs" wrap="wrap">
              <Text size="sm" fw={600}>
                {jd.onetOccupationTitle}
              </Text>
              {jd.onetSocCode ? (
                <Badge variant="light" color="brand" size="sm" ff="monospace">
                  {jd.onetSocCode}
                </Badge>
              ) : null}
            </Group>
          ) : (
            <Text size="sm" c="dimmed" fs="italic">
              Tự do (chưa chuẩn hóa O*NET)
            </Text>
          )}
        </SummaryRow>

        <Divider />

        <SummaryRow label="Cấp bậc SFIA mục tiêu">
          {onChange ? (
            catalogQuery.isPending ? (
              <Skeleton height={30} w={{ base: '100%', sm: 320 }} radius="sm" />
            ) : (
              <Stack gap={4} w={{ base: '100%', sm: 320 }}>
                <Select
                  id="sfia-level-select"
                  aria-label="Cấp bậc SFIA mục tiêu"
                  size="xs"
                  value={
                    currentSfiaLevel !== undefined
                      ? String(currentSfiaLevel)
                      : null
                  }
                  data={sfiaSelectData}
                  onChange={handleSfiaChange}
                />
                <Text size="xs" c="dimmed">
                  Quyết định độ sâu câu hỏi và tiêu chí đánh giá
                </Text>
              </Stack>
            )
          ) : (
            <Group gap="xs" wrap="wrap">
              <Badge variant="light" color="brand" size="sm">
                {currentSfiaLevel !== undefined
                  ? `SFIA Level ${currentSfiaLevel}`
                  : 'Chưa xác định'}
              </Badge>
              {matchedSfia ? (
                <Text size="xs" c="dimmed">
                  {matchedSfia.nameVi || matchedSfia.name}
                </Text>
              ) : null}
            </Group>
          )}
        </SummaryRow>

        <Divider />

        <SummaryRow label="Tech Stack trọng điểm">
          {jd.techStack.length > 0 ? (
            <Group gap={6} wrap="wrap">
              {jd.techStack.map((tech) => (
                <Badge key={tech} variant="light" color="neutral" size="sm">
                  {tech}
                </Badge>
              ))}
            </Group>
          ) : (
            <Text size="sm" c="dimmed" fs="italic">
              Chưa xác định
            </Text>
          )}
        </SummaryRow>
      </SummarySection>

      <SummarySection
        title="Thông tin JD"
        icon={<IconBriefcase size={14} stroke={1.5} aria-hidden="true" />}
      >
        <SummaryRow label="Tên công ty" value={jd.company} />
        {jd.website ? <SummaryRow label="Website" value={jd.website} /> : null}
        <SummaryRow label="Vị trí tuyển dụng" value={jd.position} />
        <SummaryRow
          label="Level yêu cầu"
          value={getJdLevelLabel(jd.level, jdLevels)}
        />
        {jd.headcount ? (
          <SummaryRow label="Số lượng tuyển" value={jd.headcount} />
        ) : null}
        {jd.location ? (
          <SummaryRow label="Địa điểm" value={jd.location} />
        ) : null}
        {jd.salary ? <SummaryRow label="Lương" value={jd.salary} /> : null}
        {jd.bonus ? <SummaryRow label="Thưởng" value={jd.bonus} /> : null}

        <Divider />

        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            Yêu cầu
          </Text>
          <Text size="sm" lineClamp={4}>
            {jd.requirements}
          </Text>
        </Stack>

        <Divider />

        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            Nội dung công việc
          </Text>
          <Text size="sm" lineClamp={4}>
            {jd.jobContent}
          </Text>
        </Stack>
      </SummarySection>

      <SummarySection
        title="Cấu hình phiên phỏng vấn"
        icon={<IconAward size={14} stroke={1.5} aria-hidden="true" />}
      >
        <SummaryRow
          label="Loại phỏng vấn"
          value={getSessionTypeLabel(sessionType, catalog?.sessionTypes ?? [])}
        />
        <SummaryRow
          label="Context Pack"
          value={getContextPackLabel(contextPack, catalog?.contextPacks ?? [])}
        />
        <SummaryRow
          label="Thời gian phỏng vấn"
          value={durationOpt ? durationOpt.label : `${duration} phút`}
        />
        <SummaryRow
          label="Số câu hỏi dự kiến"
          value={durationOpt ? `${durationOpt.numQuestions} câu` : '—'}
        />
      </SummarySection>

      {error ? (
        <Alert
          color="danger"
          variant="light"
          role="alert"
          icon={<IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />}
        >
          {error}
        </Alert>
      ) : null}
    </Stack>
  )
}
