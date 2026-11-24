'use client'

import {
  Alert,
  Badge,
  Button,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconAdjustmentsHorizontal,
  IconAlertCircle,
  IconRefresh,
  IconTable,
} from '@tabler/icons-react'
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from '@/types'
import type { SfiaAttributesViewMode } from '@/components/sfia/useSfiaParams'
import { SfiaLevelAttributesView } from './SfiaLevelAttributesView'
import { SfiaAttributesProgressionMatrix } from './SfiaAttributesProgressionMatrix'

export interface SfiaGenericAttributesViewProps {
  levels: SfiaLevelResponsibility[]
  attributes: SfiaGenericAttribute[]
  selectedLevel: number
  onSelectLevel: (levelId: number) => void
  viewMode: SfiaAttributesViewMode
  onViewModeChange: (mode: SfiaAttributesViewMode) => void
  onNavigateToMatrixWithLevel?: (levelId: number) => void
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  className?: string
}

const VIEW_MODE_OPTIONS = [
  {
    value: 'level',
    label: (
      <Group gap={6} wrap="nowrap" justify="center">
        <IconAdjustmentsHorizontal size={14} stroke={1.5} />
        <Text span size="xs" fw={600}>
          Theo Cấp độ
        </Text>
      </Group>
    ),
  },
  {
    value: 'matrix',
    label: (
      <Group gap={6} wrap="nowrap" justify="center">
        <IconTable size={14} stroke={1.5} />
        <Text span size="xs" fw={600}>
          Ma trận Tiến triển 5×7
        </Text>
      </Group>
    ),
  },
]

export function SfiaGenericAttributesView({
  levels,
  attributes,
  selectedLevel,
  onSelectLevel,
  viewMode,
  onViewModeChange,
  onNavigateToMatrixWithLevel,
  loading = false,
  error = null,
  onRetry,
  className,
}: Readonly<SfiaGenericAttributesViewProps>) {
  if (loading) {
    return (
      <Stack gap="sm" className={className} aria-busy="true">
        <Skeleton height={60} radius="md" />
        <Skeleton height={88} radius="md" />
        <Skeleton height={180} radius="md" />
        <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="sm">
          {[1, 2, 3, 4, 5].map((item) => (
            <Skeleton key={item} height={190} radius="md" />
          ))}
        </SimpleGrid>
      </Stack>
    )
  }

  if (error) {
    return (
      <Alert
        color="danger"
        radius="md"
        className={className}
        icon={<IconAlertCircle size={18} stroke={1.5} />}
        title="Không thể tải dữ liệu Cấp độ & Thuộc tính chung SFIA"
      >
        <Stack gap="xs" align="flex-start">
          <Text size="xs">{error}</Text>
          {onRetry && (
            <Button
              variant="default"
              size="xs"
              leftSection={<IconRefresh size={14} stroke={1.5} />}
              onClick={onRetry}
            >
              Thử lại
            </Button>
          )}
        </Stack>
      </Alert>
    )
  }

  return (
    <Stack
      gap="sm"
      flex={viewMode === 'matrix' ? 1 : undefined}
      mih={0}
      className={className}
    >
      <Paper withBorder p="sm" radius="md">
        <Group justify="space-between" gap="sm" wrap="wrap">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon color="warning" variant="light" size="lg" radius="md">
              <IconAdjustmentsHorizontal size={18} stroke={1.5} />
            </ThemeIcon>
            <Stack gap={2}>
              <Group gap="xs">
                <Title order={2} fz="md">
                  7 Cấp độ Trách nhiệm &amp; 5 Thuộc tính Chung Cốt lõi
                </Title>
                <Badge color="warning" variant="light" size="xs">
                  SFIA 9
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                Chuẩn đánh giá năng lực đa chiều cho AI • 7 Cấp độ • 5 Trụ cột
                hành vi
              </Text>
            </Stack>
          </Group>

          <SegmentedControl
            size="xs"
            value={viewMode}
            onChange={(val) => onViewModeChange(val as SfiaAttributesViewMode)}
            aria-label="Chế độ hiển thị Thuộc tính chung"
            data={VIEW_MODE_OPTIONS}
          />
        </Group>
      </Paper>

      {viewMode === 'level' ? (
        <SfiaLevelAttributesView
          levels={levels}
          attributes={attributes}
          selectedLevel={selectedLevel}
          onSelectLevel={onSelectLevel}
          onNavigateToMatrixWithLevel={onNavigateToMatrixWithLevel}
        />
      ) : (
        <SfiaAttributesProgressionMatrix
          levels={levels}
          attributes={attributes}
          selectedLevel={selectedLevel}
          onSelectLevel={onSelectLevel}
          onSwitchToLevelView={() => onViewModeChange('level')}
        />
      )}
    </Stack>
  )
}
