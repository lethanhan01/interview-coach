'use client'

import {
  Alert,
  Badge,
  Divider,
  Group,
  Select,
  Stack,
  Text,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconAward,
  IconBriefcase,
  IconSparkles,
} from '@tabler/icons-react'
import { getJdLevelLabel } from '@/lib/interview-options'
import { DURATION_OPTIONS, mapJdLevelToSfia } from '@/lib/setup-helpers'
import type {
  ContextPack,
  InterviewDuration,
  JdFormData,
  SessionType,
} from '@/types'
import classes from './ConfirmStep.module.css'
import {
  CONTEXT_PACK_LABELS,
  SESSION_TYPE_LABELS,
  SFIA_LEVEL_DESCRIPTIONS,
  SFIA_SELECT_DATA,
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
  const durationOpt = DURATION_OPTIONS.find((d) => d.value === duration)!
  const currentSfiaLevel = jd.targetSfiaLevel ?? mapJdLevelToSfia(jd.level)

  function handleSfiaChange(val: string | null) {
    if (!val || !onChange) return
    const levelNum = Number(val)
    if (!Number.isNaN(levelNum)) {
      onChange({ ...jd, targetSfiaLevel: levelNum })
    }
  }

  return (
    <Stack gap="lg">
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
                <Badge
                  variant="light"
                  color="brand"
                  size="sm"
                  className={classes.mono}
                >
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
            <Stack gap={4} w={{ base: '100%', sm: 320 }}>
              <Select
                id="sfia-level-select"
                aria-label="Cấp bậc SFIA mục tiêu"
                size="xs"
                value={String(currentSfiaLevel)}
                data={SFIA_SELECT_DATA}
                onChange={handleSfiaChange}
              />
              <Text size="xs" c="dimmed">
                Quyết định độ sâu câu hỏi và tiêu chí đánh giá
              </Text>
            </Stack>
          ) : (
            <Group gap="xs" wrap="wrap">
              <Badge variant="light" color="brand" size="sm">
                SFIA Level {currentSfiaLevel}
              </Badge>
              <Text size="xs" c="dimmed">
                {SFIA_LEVEL_DESCRIPTIONS[currentSfiaLevel]?.subtitle ?? ''}
              </Text>
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
        <SummaryRow label="Level yêu cầu" value={getJdLevelLabel(jd.level)} />
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
          value={SESSION_TYPE_LABELS[sessionType]}
        />
        <SummaryRow
          label="Context Pack"
          value={CONTEXT_PACK_LABELS[contextPack]}
        />
        <SummaryRow label="Thời gian phỏng vấn" value={durationOpt.label} />
        <SummaryRow
          label="Số câu hỏi dự kiến"
          value={`${durationOpt.numQuestions} câu`}
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
