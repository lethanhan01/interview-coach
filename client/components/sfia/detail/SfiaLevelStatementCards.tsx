'use client'

import { useMemo } from 'react'
import {
  Alert,
  Badge,
  Blockquote,
  Button,
  Group,
  List,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconQuote,
  IconSparkles,
} from '@tabler/icons-react'
import type { SfiaSkillDetail } from '@/types'
import { getSfiaCategorySemanticTheme } from '../sfia-semantic-theme'

export interface SfiaLevelStatementCardsProps {
  skillDetail: SfiaSkillDetail
  selectedLevel: number
  onSelectLevel: (level: number) => void
  className?: string
}

export function SfiaLevelStatementCards({
  skillDetail,
  selectedLevel,
  onSelectLevel,
  className,
}: Readonly<SfiaLevelStatementCardsProps>) {
  const theme = getSfiaCategorySemanticTheme(skillDetail.categoryCode)

  const currentStatement = skillDetail.skillLevels.find(
    (sl) => sl.levelId === selectedLevel
  )

  const availableLevels = skillDetail.skillLevels.map((sl) => sl.levelId)
  const isLevelInRange =
    selectedLevel >= skillDetail.minLevel &&
    selectedLevel <= skillDetail.maxLevel

  const parsedStatements = useMemo(() => {
    if (!currentStatement?.description) return []
    const text = currentStatement.description.trim()
    const rawParts = text.split(/(?<=\.)\s+(?=[A-ZÀ-Ỹ0-9])/)
    const cleaned = rawParts.map((p) => p.trim()).filter((p) => p.length > 0)
    if (cleaned.length <= 1 && text.length > 80) {
      return [text]
    }
    return cleaned.length > 0 ? cleaned : [text]
  }, [currentStatement])

  return (
    <Stack gap="sm" className={className}>
      {/* Out of Range Warning */}
      {!isLevelInRange && (
        <Alert
          color="warning"
          title={`Kỹ năng ${skillDetail.code} không áp dụng tại Cấp độ ${selectedLevel}`}
          icon={<IconAlertTriangle size={16} />}
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Text size="xs">
              SFIA 9 xác định dải năng lực cho {skillDetail.name} từ Cấp độ{' '}
              {skillDetail.minLevel} đến Cấp độ {skillDetail.maxLevel}.
            </Text>
            <Button
              variant="default"
              size="xs"
              onClick={() => onSelectLevel(skillDetail.minLevel)}
              rightSection={<IconArrowRight size={14} stroke={1.5} />}
            >
              Chuyển sang Cấp độ {skillDetail.minLevel}
            </Button>
          </Group>
        </Alert>
      )}

      {/* 1. Level Essence Quote */}
      <Paper withBorder p="sm" radius="md">
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Group gap="xs" align="center">
              <ThemeIcon
                color={theme.color}
                variant="light"
                size="sm"
                radius="sm"
              >
                <IconSparkles size={14} stroke={1.5} />
              </ThemeIcon>
              <Text size="xs" fw={700} tt="uppercase">
                Tinh hoa cấp độ {selectedLevel}
              </Text>
            </Group>
            <Badge color={theme.color} variant="light" size="xs">
              Cấp độ SFIA L{selectedLevel}
            </Badge>
          </Group>

          <Blockquote
            color={theme.color}
            icon={<IconQuote size={14} stroke={1.5} />}
            p="xs"
            radius="sm"
          >
            <Text size="xs" fs="italic">
              {currentStatement?.essence ||
                'Thể hiện năng lực chuyên môn và tinh thần trách nhiệm tương ứng với cấp độ này.'}
            </Text>
          </Blockquote>
        </Stack>
      </Paper>

      {/* 2. Detailed Behavioral Statements */}
      <Paper withBorder p="sm" radius="md">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Stack gap={2}>
              <Title order={4} fz="sm" fw={700}>
                Hành vi chuẩn mực
              </Title>
              <Text size="xs" c="dimmed">
                Tiêu chuẩn đánh giá cho {skillDetail.name} ({skillDetail.code})
                tại Cấp độ {selectedLevel}
              </Text>
            </Stack>
            <Badge color="neutral" variant="light" size="xs">
              {parsedStatements.length} tiêu chí
            </Badge>
          </Group>

          {currentStatement ? (
            <List
              spacing="xs"
              size="xs"
              icon={
                <ThemeIcon
                  color="success"
                  size={16}
                  radius="xl"
                  variant="light"
                >
                  <IconCheck size={10} stroke={2} />
                </ThemeIcon>
              }
            >
              {parsedStatements.map((statement, idx) => (
                <List.Item key={idx}>
                  <Text size="xs" lh={1.5}>
                    {statement}
                  </Text>
                </List.Item>
              ))}
            </List>
          ) : (
            <Paper withBorder p="md" radius="sm" ta="center">
              <Text size="xs" c="dimmed">
                Không tìm thấy dữ liệu tiêu chí hành vi cho Cấp độ{' '}
                {selectedLevel}.
              </Text>
              {availableLevels.length > 0 && (
                <Button
                  variant="subtle"
                  size="xs"
                  mt="xs"
                  onClick={() => onSelectLevel(availableLevels[0])}
                >
                  Xem Cấp độ {availableLevels[0]} khả dụng
                </Button>
              )}
            </Paper>
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}
