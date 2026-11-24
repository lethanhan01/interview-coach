'use client'

import { useMemo, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  CloseButton,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconArrowUpRight,
  IconDownload,
  IconSearch,
  IconStack2,
} from '@tabler/icons-react'
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from '@/types'
import { downloadSfiaAttributesProgressionCsv } from './sfia-attributes-export'
import { SfiaProgressionTable } from './SfiaProgressionTable'
import classes from './SfiaAttributesProgressionMatrix.module.css'

export interface SfiaAttributesProgressionMatrixProps {
  levels: SfiaLevelResponsibility[]
  attributes: SfiaGenericAttribute[]
  selectedLevel: number
  onSelectLevel: (levelId: number) => void
  onSwitchToLevelView?: () => void
  className?: string
}

export function SfiaAttributesProgressionMatrix({
  levels,
  attributes,
  selectedLevel,
  onSelectLevel,
  onSwitchToLevelView,
  className,
}: Readonly<SfiaAttributesProgressionMatrixProps>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const filteredAttributes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return attributes

    return attributes.filter((attr) => {
      const matchMeta =
        attr.name.toLowerCase().includes(q) ||
        attr.nameVi.toLowerCase().includes(q) ||
        attr.code.toLowerCase().includes(q) ||
        attr.description.toLowerCase().includes(q)

      if (matchMeta) return true

      return Object.values(attr.levels).some((statement) =>
        statement.toLowerCase().includes(q)
      )
    })
  }, [attributes, searchQuery])

  const handleExportCsv = () => {
    try {
      setIsExporting(true)
      const ok = downloadSfiaAttributesProgressionCsv(levels, attributes)
      notifications.show({
        color: ok ? 'success' : 'danger',
        title: ok ? 'Xuất CSV thành công' : 'Xuất CSV thất bại',
        message: ok
          ? 'Đã tải xuống tệp CSV UTF-8 Ma trận Tiến triển 5 thuộc tính × 7 cấp độ.'
          : 'Không thể tạo tệp CSV Ma trận Tiến triển.',
      })
    } catch {
      notifications.show({
        color: 'danger',
        title: 'Lỗi xuất dữ liệu',
        message: 'Đã xảy ra lỗi khi xuất Ma trận Tiến triển.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Box className={[classes.root, className].filter(Boolean).join(' ')}>
      <Paper withBorder p="sm" radius="md">
        <Group justify="space-between" align="center" gap="sm" wrap="wrap">
          <Group gap="sm" align="center" wrap="nowrap">
            <ThemeIcon color="brand" variant="light" size="md" radius="md">
              <IconStack2 size={16} stroke={1.5} />
            </ThemeIcon>
            <Stack gap={2}>
              <Group gap="xs" align="center">
                <Title order={3} fz="sm">
                  Ma trận Tiến triển 5 Thuộc tính Chung (5×7)
                </Title>
                <Badge color="brand" variant="light" size="xs">
                  SFIA 9
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                So sánh tiến triển tiêu chuẩn hành vi qua 7 cấp độ trách nhiệm
                (L1 ➔ L7)
              </Text>
            </Stack>
          </Group>

          <Group gap="xs" align="center" wrap="wrap">
            <TextInput
              size="xs"
              w={{ base: '100%', sm: 240 }}
              placeholder="Tìm kiếm tiêu chí thuộc tính..."
              aria-label="Tìm kiếm tiêu chí thuộc tính"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              leftSection={<IconSearch size={14} stroke={1.5} />}
              rightSection={
                searchQuery ? (
                  <CloseButton
                    size="xs"
                    aria-label="Xóa từ khóa tìm kiếm"
                    onClick={() => setSearchQuery('')}
                  />
                ) : undefined
              }
            />

            <Button
              variant="default"
              size="xs"
              leftSection={<IconDownload size={14} stroke={1.5} />}
              onClick={handleExportCsv}
              loading={isExporting}
            >
              Xuất CSV Ma trận
            </Button>
          </Group>
        </Group>
      </Paper>

      <SfiaProgressionTable
        levels={levels}
        attributes={filteredAttributes}
        totalAttributesCount={attributes.length}
        selectedLevel={selectedLevel}
        searchQuery={searchQuery}
        onSelectLevel={onSelectLevel}
        onClearSearch={() => setSearchQuery('')}
      />

      <Paper withBorder px="sm" py="xs" radius="md">
        <Group justify="space-between" align="center" gap="xs" wrap="wrap">
          <Group gap="xs" align="center">
            <Badge color="success" variant="dot" size="xs">
              SFIA 9
            </Badge>
            <Text size="xs" c="dimmed">
              Ma trận Tiến triển 5 Thuộc tính × 7 Cấp độ — Chuẩn quốc tế SFIA 9
            </Text>
          </Group>

          <Group gap="xs" align="center">
            <Text size="xs" c="dimmed">
              Cột đang chọn:{' '}
              <Text span fw={700} c="brand">
                Cấp độ L{selectedLevel}
              </Text>
            </Text>
            {onSwitchToLevelView && (
              <Button
                variant="light"
                color="brand"
                size="compact-xs"
                rightSection={<IconArrowUpRight size={13} stroke={1.5} />}
                onClick={onSwitchToLevelView}
              >
                Xem chi tiết Cấp L{selectedLevel}
              </Button>
            )}
          </Group>
        </Group>
      </Paper>
    </Box>
  )
}
