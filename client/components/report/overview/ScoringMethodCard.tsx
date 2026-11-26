'use client'

import {
  Alert,
  Badge,
  Card,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconInfoCircle, IconSparkles } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { getSessionTypeLabel } from '@/lib/interview-option-helpers'
import { catalogQueries } from '@/queries/catalog.queries'
import type {
  CatalogSfiaLevelOption,
  ContextPack,
  SessionType,
  SessionTypeOption,
} from '@/types'
import { ScoringMethodAccordion } from './ScoringMethodAccordion'

export interface ScoringMethodCardProps {
  contextPackId?: ContextPack
  sessionType?: SessionType
  sfiaLevels?: readonly CatalogSfiaLevelOption[]
  sessionTypes?: readonly SessionTypeOption[]
  className?: string
}

export function ScoringMethodCard({
  contextPackId,
  sessionType,
  sfiaLevels,
  sessionTypes,
  className,
}: Readonly<ScoringMethodCardProps>) {
  const catalogQuery = useQuery(catalogQueries.interviewOptions())
  const resolvedSessionTypes =
    sessionTypes ?? catalogQuery.data?.sessionTypes ?? []
  const resolvedSfiaLevels = sfiaLevels ?? catalogQuery.data?.sfiaLevels
  const sessionLabel =
    (sessionType
      ? getSessionTypeLabel(sessionType, resolvedSessionTypes)
      : '') || 'Phỏng vấn Chuẩn hóa'

  return (
    <Card withBorder radius="md" p="lg" className={className}>
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="sm" align="center">
            <ThemeIcon size="lg" radius="md" variant="light" color="brand">
              <IconSparkles size={20} stroke={1.5} aria-hidden="true" />
            </ThemeIcon>
            <Stack gap={2}>
              <Title order={2} size="h4">
                Phương Pháp Đánh Giá Chuẩn Hóa SFIA 9 &amp; O*NET
              </Title>
              <Text size="xs" c="dimmed">
                Cơ chế chấm điểm tất định, thẩm định nhị phân và đối chiếu cấp
                độ năng lực
              </Text>
            </Stack>
          </Group>

          <Group gap="xs">
            <Badge variant="outline" size="sm">
              {sessionLabel}
            </Badge>
            {contextPackId ? (
              <Badge variant="light" color="neutral" size="sm">
                Bối cảnh: {contextPackId}
              </Badge>
            ) : null}
          </Group>
        </Group>

        <Alert
          color="brand"
          variant="light"
          icon={<IconInfoCircle size={18} stroke={1.5} aria-hidden="true" />}
        >
          <Text size="xs" lh="relaxed">
            Hệ thống áp dụng{' '}
            <Text component="span" fw={700}>
              Cỗ máy Đánh giá Tinh gọn (Unified Interview Engine)
            </Text>
            , kết hợp bộ tiêu chí nhị phân 2 chiều, khung kỹ năng toàn cầu{' '}
            <Text component="span" fw={700}>
              SFIA Version 9
            </Text>{' '}
            và phân loại nghề nghiệp chuẩn hóa{' '}
            <Text component="span" fw={700}>
              O*NET
            </Text>
            . Đảm bảo tính khách quan, minh bạch và nhất quán cho mọi ứng viên.
          </Text>
        </Alert>

        <ScoringMethodAccordion
          sfiaLevels={resolvedSfiaLevels}
          isPending={!sfiaLevels && catalogQuery.isPending}
          isError={!sfiaLevels && catalogQuery.isError}
          onRetry={() => void catalogQuery.refetch()}
        />
      </Stack>
    </Card>
  )
}

export default ScoringMethodCard
