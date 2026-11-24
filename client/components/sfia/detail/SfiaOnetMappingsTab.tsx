'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ActionIcon,
  Button,
  Center,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import {
  IconBriefcase,
  IconCompass,
  IconSearch,
  IconX,
} from '@tabler/icons-react'
import type { SfiaOnetMappingItem } from '@/types'
import { SfiaOnetMappingCard, SfiaOnetMappingRow } from './SfiaOnetMappingRow'

export interface SfiaOnetMappingsTabProps {
  skillCode: string
  skillName: string
  onetMappings: SfiaOnetMappingItem[]
  className?: string
}

type OnetFilterType = 'all' | 'core' | 'supplemental'

export function SfiaOnetMappingsTab({
  skillCode,
  skillName,
  onetMappings = [],
  className,
}: Readonly<SfiaOnetMappingsTabProps>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<OnetFilterType>('all')

  const coreCount = useMemo(
    () => onetMappings.filter((m) => m.isCore).length,
    [onetMappings]
  )
  const supplementalCount = onetMappings.length - coreCount

  const filteredAndSortedMappings = useMemo(() => {
    let result = [...onetMappings]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (m) =>
          m.socCode.toLowerCase().includes(q) ||
          m.occupationTitle.toLowerCase().includes(q)
      )
    }

    if (filterType === 'core') {
      result = result.filter((m) => m.isCore)
    } else if (filterType === 'supplemental') {
      result = result.filter((m) => !m.isCore)
    }

    result.sort((a, b) => {
      if (a.isCore !== b.isCore) {
        return a.isCore ? -1 : 1
      }
      if (b.weight !== a.weight) {
        return b.weight - a.weight
      }
      return a.socCode.localeCompare(b.socCode)
    })

    return result
  }, [onetMappings, searchQuery, filterType])

  if (onetMappings.length === 0) {
    return (
      <Paper withBorder radius="md" p="xl" ta="center" className={className}>
        <Stack align="center" gap="sm">
          <Paper
            withBorder
            p="sm"
            radius="xl"
            bg="var(--mantine-color-body)"
            w={48}
            h={48}
          >
            <Center h="100%">
              <IconBriefcase size={24} stroke={1.5} />
            </Center>
          </Paper>

          <Stack gap={2} maw={400}>
            <Text fw={700} size="sm">
              Chưa có ánh xạ nghề nghiệp O*NET
            </Text>
            <Text size="xs" c="dimmed">
              Kỹ năng{' '}
              <Text span ff="monospace" fw={600}>
                {skillCode}
              </Text>{' '}
              ({skillName}) hiện chưa được liên kết với nghề nghiệp O*NET SOC
              nào trong cơ sở dữ liệu.
            </Text>
          </Stack>

          <Button
            component={Link}
            href="/admin/onet"
            variant="light"
            color="brand"
            size="xs"
            leftSection={<IconCompass size={14} stroke={1.5} />}
          >
            Khám phá O*NET Browser
          </Button>
        </Stack>
      </Paper>
    )
  }

  return (
    <Stack gap="sm" className={className}>
      {/* 1. Header Toolbar */}
      <Paper withBorder p="xs" radius="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <TextInput
            size="xs"
            placeholder="Tìm theo mã SOC hoặc tên nghề nghiệp..."
            aria-label="Tìm kiếm nghề nghiệp O*NET"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            leftSection={<IconSearch size={14} stroke={1.5} />}
            rightSection={
              searchQuery ? (
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="neutral"
                  onClick={() => setSearchQuery('')}
                  aria-label="Xóa tìm kiếm"
                >
                  <IconX size={12} stroke={1.5} />
                </ActionIcon>
              ) : null
            }
            flex={1}
            miw={200}
          />

          <SegmentedControl
            size="xs"
            value={filterType}
            onChange={(val) => setFilterType(val as OnetFilterType)}
            data={[
              { value: 'all', label: `Tất cả (${onetMappings.length})` },
              { value: 'core', label: `Cốt lõi (${coreCount})` },
              { value: 'supplemental', label: `Bổ trợ (${supplementalCount})` },
            ]}
          />
        </Group>
      </Paper>

      {/* 2. Content */}
      {filteredAndSortedMappings.length === 0 ? (
        <Paper withBorder p="xl" radius="md" ta="center">
          <Stack align="center" gap="xs">
            <IconSearch size={28} stroke={1.5} />
            <Text fw={700} size="sm">
              Không tìm thấy nghề nghiệp phù hợp
            </Text>
            <Text size="xs" c="dimmed">
              Không có nghề nghiệp nào khớp với từ khóa &quot;{searchQuery}
              &quot;.
            </Text>
            <Button
              variant="outline"
              size="xs"
              color="neutral"
              onClick={() => {
                setSearchQuery('')
                setFilterType('all')
              }}
            >
              Đặt lại bộ lọc
            </Button>
          </Stack>
        </Paper>
      ) : (
        <>
          {/* Desktop Table */}
          <Paper withBorder radius="md" visibleFrom="sm">
            <Table.ScrollContainer minWidth={650}>
              <Table
                verticalSpacing="xs"
                horizontalSpacing="sm"
                highlightOnHover
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={120}>Mã SOC</Table.Th>
                    <Table.Th miw={200}>Chức danh nghề nghiệp O*NET</Table.Th>
                    <Table.Th w={100} ta="center">
                      Cấp độ
                    </Table.Th>
                    <Table.Th w={140}>Trọng số</Table.Th>
                    <Table.Th w={100} ta="center">
                      Phân loại
                    </Table.Th>
                    <Table.Th w={80} ta="right">
                      Thao tác
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredAndSortedMappings.map((mapping) => (
                    <SfiaOnetMappingRow
                      key={mapping.socCode}
                      mapping={mapping}
                    />
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>

          {/* Mobile Cards */}
          <Stack gap="xs" hiddenFrom="sm">
            {filteredAndSortedMappings.map((mapping) => (
              <SfiaOnetMappingCard key={mapping.socCode} mapping={mapping} />
            ))}
          </Stack>
        </>
      )}
    </Stack>
  )
}
