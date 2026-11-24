'use client'

import {
  Alert,
  Badge,
  Blockquote,
  Group,
  Paper,
  Stack,
  Text,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconBook,
  IconBriefcase,
  IconHelpCircle,
  IconQuote,
} from '@tabler/icons-react'
import type { SfiaLevelResponsibility, SfiaSkillDetail } from '@/types'
import { getSfiaLevelSemanticTheme } from '@/components/sfia/sfia-theme'
import surfaces from '@/styles/surfaces.module.css'

export interface SfiaInspectionDetailsProps {
  detail: SfiaSkillDetail
  levelId: number
  levels?: SfiaLevelResponsibility[]
}

const DIFFICULTY_META: Record<
  string,
  { label: string; color: 'success' | 'warning' | 'danger' }
> = {
  EASY: { label: 'Dễ', color: 'success' },
  MEDIUM: { label: 'Trung bình', color: 'warning' },
  HARD: { label: 'Khó', color: 'danger' },
}

export function SfiaInspectionDetails({
  detail,
  levelId,
  levels,
}: Readonly<SfiaInspectionDetailsProps>) {
  const levelTheme = getSfiaLevelSemanticTheme(levelId)
  const levelMeta = levels?.find((l) => l.levelId === levelId)
  const levelTitle =
    levelMeta?.nameVi || levelMeta?.name || `Cấp độ L${levelId}`
  const levelStatement = detail.skillLevels.find((l) => l.levelId === levelId)
  const levelQuestions = detail.questionBankItems.filter(
    (q) => q.targetSfiaLevel === levelId
  )
  const levelOnetMappings = detail.onetMappings.filter(
    (m) => m.targetLevel === levelId
  )
  const isBlindSpot = levelQuestions.length === 0

  return (
    <Stack gap="sm">
      <Paper withBorder radius="md" p="sm" className={surfaces.subtleSurface}>
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Group gap="xs" align="center">
            <Badge
              color={levelTheme.color}
              variant={levelTheme.badgeVariant}
              ff="monospace"
            >
              Cấp độ {levelId}
            </Badge>
            <Text size="sm" fw={700}>
              {levelTitle}
            </Text>
          </Group>

          {isBlindSpot ? (
            <Badge
              color="danger"
              variant="light"
              leftSection={<IconAlertTriangle size={12} stroke={1.5} />}
            >
              Điểm mù (0 câu hỏi)
            </Badge>
          ) : (
            <Badge color="success" variant="light">
              {levelQuestions.length} câu hỏi
            </Badge>
          )}
        </Group>
      </Paper>

      {levelStatement?.essence && (
        <Blockquote
          color="brand"
          icon={<IconQuote size={16} stroke={1.5} />}
          p="sm"
          radius="md"
        >
          <Stack gap={4}>
            <Text size="xs" fw={700} tt="uppercase" c="dimmed">
              Tinh hoa cấp độ
            </Text>
            <Text size="xs" fs="italic">
              &ldquo;{levelStatement.essence}&rdquo;
            </Text>
          </Stack>
        </Blockquote>
      )}

      <Paper withBorder radius="md" p="sm">
        <Stack gap="xs">
          <Group gap="xs" align="center">
            <IconBook size={16} stroke={1.5} />
            <Text size="xs" fw={700}>
              Tuyên bố hành vi chuẩn SFIA 9
            </Text>
          </Group>
          <Text size="xs" lh={1.6} className={surfaces.preLine}>
            {levelStatement?.description ||
              `Tiêu chuẩn năng lực cho ${detail.name} tại Cấp độ ${levelId}.`}
          </Text>
        </Stack>
      </Paper>

      <Paper withBorder radius="md" p="sm">
        <Stack gap="xs">
          <Group gap="xs" align="center">
            <IconHelpCircle size={16} stroke={1.5} />
            <Text size="xs" fw={700}>
              Ngân hàng câu hỏi ({levelQuestions.length})
            </Text>
          </Group>

          {isBlindSpot ? (
            <Alert
              color="warning"
              icon={<IconAlertTriangle size={16} stroke={1.5} />}
              title="Cảnh báo điểm mù"
            >
              <Text size="xs">
                Chưa có câu hỏi phỏng vấn nào cho {detail.code} ở Cấp độ{' '}
                {levelId}. Nhấn &ldquo;Tạo câu hỏi&rdquo; bên dưới để bổ sung.
              </Text>
            </Alert>
          ) : (
            <Stack gap="xs">
              {levelQuestions.slice(0, 3).map((q) => {
                const diff = DIFFICULTY_META[q.difficulty] ?? {
                  label: q.difficulty,
                  color: 'neutral' as const,
                }
                return (
                  <Paper
                    key={q.id}
                    withBorder
                    radius="sm"
                    p="xs"
                    className={surfaces.subtleSurface}
                  >
                    <Stack gap={4}>
                      <Group justify="space-between" align="center">
                        <Text size="xs" ff="monospace" c="dimmed">
                          {q.id}
                        </Text>
                        <Badge color={diff.color} variant="light" size="xs">
                          {diff.label}
                        </Badge>
                      </Group>
                      <Text size="xs" fw={500} lineClamp={2}>
                        {q.questionText}
                      </Text>
                    </Stack>
                  </Paper>
                )
              })}
              {levelQuestions.length > 3 && (
                <Text size="xs" c="dimmed" ta="center" fs="italic">
                  và {levelQuestions.length - 3} câu hỏi khác...
                </Text>
              )}
            </Stack>
          )}
        </Stack>
      </Paper>

      <Paper withBorder radius="md" p="sm">
        <Stack gap="xs">
          <Group gap="xs" align="center">
            <IconBriefcase size={16} stroke={1.5} />
            <Text size="xs" fw={700}>
              Nghề O*NET yêu cầu cấp độ này ({levelOnetMappings.length})
            </Text>
          </Group>

          {levelOnetMappings.length === 0 ? (
            <Text size="xs" c="dimmed" fs="italic">
              Chưa có nghề O*NET nào ánh xạ trực tiếp ở cấp độ này.
            </Text>
          ) : (
            <Stack gap="xs">
              {levelOnetMappings.map((m) => (
                <Paper
                  key={m.socCode}
                  withBorder
                  radius="sm"
                  p="xs"
                  className={surfaces.subtleSurface}
                >
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Group gap="xs" align="center" wrap="nowrap" miw={0}>
                      <Text size="xs" ff="monospace" fw={600}>
                        {m.socCode}
                      </Text>
                      <Text size="xs" truncate>
                        {m.occupationTitle}
                      </Text>
                    </Group>
                    <Group gap={6} align="center" wrap="nowrap">
                      {m.isCore && (
                        <Badge color="brand" variant="light" size="xs">
                          Cốt lõi
                        </Badge>
                      )}
                      <Text size="xs" ff="monospace" c="dimmed">
                        w:{m.weight}
                      </Text>
                    </Group>
                  </Group>
                </Paper>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}
