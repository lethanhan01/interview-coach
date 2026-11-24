import {
  Alert,
  Badge,
  Box,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconCircleCheck,
  IconCircleX,
  IconQuote,
} from '@tabler/icons-react'
import type { BinaryCriterionResult } from '@/types'

export interface BinaryCriteriaChecklistProps {
  criteria?: BinaryCriterionResult[]
  className?: string
}

export function BinaryCriteriaChecklist({
  criteria = [],
  className,
}: Readonly<BinaryCriteriaChecklistProps>) {
  if (!criteria || criteria.length === 0) {
    return null
  }

  const passedCount = criteria.filter((c) => c.passed).length
  const totalCount = criteria.length
  const passRate = Math.round((passedCount / totalCount) * 100)

  return (
    <Stack gap="xs" className={className}>
      <Group justify="space-between" align="center">
        <Text size="xs" fw={700} tt="uppercase">
          Tiêu Chí Đánh Giá Nhị Phân (Binary Criteria)
        </Text>
        <Text size="xs" c="dimmed">
          Đạt {passedCount}/{totalCount} tiêu chí
        </Text>
      </Group>

      <Progress.Root
        size="sm"
        radius="xl"
        aria-label="Tỷ lệ đạt tiêu chí nhị phân"
      >
        <Progress.Section
          value={passRate}
          color="success"
          aria-label="Tiêu chí đạt"
        />
        <Progress.Section
          value={100 - passRate}
          color="danger"
          aria-label="Tiêu chí không đạt"
        />
      </Progress.Root>

      <Stack gap="xs">
        {criteria.map((criterion, idx) => {
          const isCore = criterion.dimension === 'core'
          const isSeniority = criterion.dimension === 'seniority'

          return (
            <Paper
              key={criterion.criteriaId || `crit-${idx}`}
              withBorder
              radius="md"
              p="sm"
            >
              <Stack gap="xs">
                <Group justify="space-between" align="center" wrap="wrap">
                  <Group gap="xs" wrap="wrap">
                    {criterion.passed ? (
                      <IconCircleCheck
                        size={16}
                        aria-hidden="true"
                        color="var(--mantine-color-success-filled)"
                      />
                    ) : (
                      <IconCircleX
                        size={16}
                        aria-hidden="true"
                        color="var(--mantine-color-danger-filled)"
                      />
                    )}

                    {isCore && (
                      <Badge variant="outline" size="sm" color="neutral">
                        Cốt lõi (Core)
                      </Badge>
                    )}
                    {isSeniority && (
                      <Badge variant="light" size="sm" color="brand">
                        Thâm niên (Seniority)
                      </Badge>
                    )}
                    {!isCore && !isSeniority && (
                      <Badge variant="light" size="sm" color="neutral">
                        Tiêu chí
                      </Badge>
                    )}

                    <Text size="xs" fw={600}>
                      {criterion.criteriaText || criterion.criteriaId}
                    </Text>
                  </Group>

                  <Badge
                    variant="light"
                    size="sm"
                    color={criterion.passed ? 'success' : 'danger'}
                  >
                    {criterion.passed ? 'Đạt' : 'Không đạt'}
                  </Badge>
                </Group>

                {criterion.evidence && (
                  <Paper
                    withBorder
                    radius="sm"
                    p="xs"
                    bg="var(--mantine-color-default)"
                  >
                    <Group gap={4} mb={4}>
                      <ThemeIcon
                        size={16}
                        variant="transparent"
                        color="neutral"
                      >
                        <IconQuote size={12} aria-hidden="true" />
                      </ThemeIcon>
                      <Text size="xs" fw={500} c="dimmed">
                        Bằng chứng ghi nhận:
                      </Text>
                    </Group>
                    <Text size="xs" fs="italic" pl="sm">
                      &ldquo;{criterion.evidence}&rdquo;
                    </Text>
                  </Paper>
                )}

                {!criterion.passed && criterion.deductionReason && (
                  <Alert
                    color="danger"
                    variant="light"
                    radius="sm"
                    p="xs"
                    icon={<IconAlertCircle size={14} />}
                    title="Lý do chưa đạt:"
                  >
                    <Text size="xs">{criterion.deductionReason}</Text>
                  </Alert>
                )}
              </Stack>
            </Paper>
          )
        })}
      </Stack>
    </Stack>
  )
}

export default BinaryCriteriaChecklist
