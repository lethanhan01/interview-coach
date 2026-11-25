'use client'

import {
  Badge,
  Blockquote,
  Button,
  Divider,
  Group,
  Menu,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconBraces,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconMarkdown,
  IconSparkles,
} from '@tabler/icons-react'
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from '@/types'
import { getSfiaLevelSemanticTheme } from '@/components/sfia/sfia-theme'
import { SfiaLevelSpanStepper } from '../detail/SfiaLevelSpanStepper'
import { copySfiaLevelPromptToClipboard } from './sfia-attributes-prompt-helper'
import { SfiaLevelAttributeCard } from './SfiaLevelAttributeCard'

export interface SfiaLevelAttributesViewProps {
  levels: SfiaLevelResponsibility[]
  attributes: SfiaGenericAttribute[]
  selectedLevel: number
  onSelectLevel: (levelId: number) => void
  onNavigateToMatrixWithLevel?: (levelId: number) => void
  className?: string
}

export function SfiaLevelAttributesView({
  levels,
  attributes,
  selectedLevel,
  onSelectLevel,
  onNavigateToMatrixWithLevel,
  className,
}: Readonly<SfiaLevelAttributesViewProps>) {
  const currentLevel = levels.find((l) => l.levelId === selectedLevel) ??
    levels[0] ?? {
      levelId: selectedLevel,
      name: `Level ${selectedLevel}`,
      nameVi: `Cấp độ ${selectedLevel}`,
      essence: 'Chưa có mô tả tinh hoa cho cấp độ này.',
      description: 'Chưa có mô tả phạm vi cho cấp độ này.',
    }

  const levelTheme = getSfiaLevelSemanticTheme(selectedLevel)

  const handleCopyRubric = async (format: 'markdown' | 'json') => {
    const ok = await copySfiaLevelPromptToClipboard(
      currentLevel,
      attributes,
      format
    )
    notifications.show({
      color: ok ? 'success' : 'danger',
      message: ok
        ? format === 'markdown'
          ? 'Đã sao chép AI Rubric (Markdown)'
          : 'Đã sao chép AI Rubric (JSON)'
        : 'Không thể sao chép AI Rubric vào bộ nhớ tạm',
    })
  }

  return (
    <Stack gap="sm" className={className}>
      <SfiaLevelSpanStepper
        minLevel={1}
        maxLevel={7}
        selectedLevel={selectedLevel}
        categoryCode="STRAT_ARCH"
        onSelectLevel={onSelectLevel}
        levels={levels}
      />

      <Paper withBorder p="sm" radius="md">
        <Stack gap="xs">
          <Group
            justify="space-between"
            align="flex-start"
            gap="xs"
            wrap="wrap"
          >
            <Group gap="xs" wrap="nowrap">
              <Badge
                color={levelTheme.color}
                variant={levelTheme.badgeVariant}
                size="lg"
                radius="md"
              >
                L{selectedLevel}
              </Badge>
              <Stack gap={2}>
                <Title order={3} fz="lg">
                  Cấp độ {selectedLevel} —{' '}
                  {currentLevel.nameVi || currentLevel.name}
                </Title>
                <Text size="sm" c="dimmed">
                  ({currentLevel.name}) • Chuẩn hành vi &amp; trách nhiệm quốc
                  tế SFIA 9
                </Text>
              </Stack>
            </Group>

            <Group gap="xs" wrap="wrap">
              <Menu withinPortal position="bottom-end">
                <Menu.Target>
                  <Button
                    variant="light"
                    color="brand"
                    size="sm"
                    leftSection={<IconCopy size={15} stroke={1.5} />}
                    rightSection={<IconChevronDown size={15} stroke={1.5} />}
                  >
                    Xuất AI Rubric
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconMarkdown size={15} stroke={1.5} />}
                    onClick={() => handleCopyRubric('markdown')}
                  >
                    Sao chép Markdown
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconBraces size={15} stroke={1.5} />}
                    onClick={() => handleCopyRubric('json')}
                  >
                    Sao chép JSON
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>

              {onNavigateToMatrixWithLevel && (
                <Button
                  variant="default"
                  size="sm"
                  rightSection={<IconChevronRight size={15} stroke={1.5} />}
                  onClick={() => onNavigateToMatrixWithLevel(selectedLevel)}
                >
                  Xem kỹ năng Cấp L{selectedLevel}
                </Button>
              )}
            </Group>
          </Group>

          <Divider />

          <Blockquote
            color="brand"
            icon={<IconSparkles size={16} stroke={1.5} />}
            cite={`Tinh hoa Cấp độ ${selectedLevel}`}
            p="xs"
            radius="sm"
          >
            <Text size="sm" lh={1.55}>
              &quot;{currentLevel.essence}&quot;
            </Text>
          </Blockquote>

          <Stack gap={4}>
            <Text size="sm" fw={700}>
              Phạm vi &amp; Trách nhiệm tổng quát:
            </Text>
            <Text size="sm" c="dimmed" lh={1.6}>
              {currentLevel.description}
            </Text>
          </Stack>
        </Stack>
      </Paper>

      <Stack gap="xs">
        <Group justify="space-between" gap="xs" wrap="wrap">
          <Title order={3} fz="md">
            5 Thuộc tính Chung Cốt lõi tại Cấp độ {selectedLevel}
          </Title>
          <Text size="sm" c="dimmed">
            Tiêu chuẩn hành vi nền tảng cho đánh giá AI
          </Text>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="xs">
          {attributes.map((attr) => (
            <SfiaLevelAttributeCard
              key={attr.code}
              attribute={attr}
              selectedLevel={selectedLevel}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </Stack>
  )
}
