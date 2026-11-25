'use client'

import { useMemo, useState } from 'react'
import {
  Button,
  Divider,
  Group,
  Pagination,
  Paper,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconCircleCheck, IconSearchOff } from '@tabler/icons-react'
import surfaces from '@/styles/surfaces.module.css'
import typography from '@/styles/typography.module.css'
import type {
  SfiaCategory,
  SfiaLevelResponsibility,
  SfiaSkillSummary,
} from '@/types'
import { filterBlindSpotSkills } from './sfia-analytics-export'
import { SfiaBlindSpotsRow } from './SfiaBlindSpotsRow'
import { SfiaBlindSpotsToolbar } from './SfiaBlindSpotsToolbar'

export interface SfiaBlindSpotsTableProps {
  skills: SfiaSkillSummary[]
  categories: SfiaCategory[]
  levels?: SfiaLevelResponsibility[]
  selectedCategoryFilter?: string | null
  selectedLevelFilter?: number | null
  onSelectCategoryFilter?: (categoryCode: string | null) => void
  onSelectLevelFilter?: (level: number | null) => void
  onCreateQuestion: (skill: SfiaSkillSummary) => void
  onSelectSkill: (skillCode: string) => void
  onExportCsv?: () => void
  isExportingCsv?: boolean
  className?: string
}

const PAGE_SIZE = 10
const getControlProps = (control: 'first' | 'previous' | 'next' | 'last') =>
  control === 'previous'
    ? { 'aria-label': 'Trang trước' }
    : control === 'next'
      ? { 'aria-label': 'Trang sau' }
      : {}

export function SfiaBlindSpotsTable({
  skills,
  categories,
  levels,
  selectedCategoryFilter = null,
  selectedLevelFilter = null,
  onSelectCategoryFilter,
  onSelectLevelFilter,
  onCreateQuestion,
  onSelectSkill,
  onExportCsv,
  isExportingCsv = false,
  className,
}: Readonly<SfiaBlindSpotsTableProps>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const allBlindSpots = useMemo(
    () => skills.filter((s) => s.questionCount === 0),
    [skills]
  )
  const categoryNameMap = useMemo(
    () => new Map(categories.map((c) => [c.code, c.nameVi || c.name])),
    [categories]
  )

  const filteredSkills = useMemo(
    () =>
      filterBlindSpotSkills(
        allBlindSpots,
        selectedCategoryFilter,
        selectedLevelFilter,
        searchQuery
      ),
    [allBlindSpots, selectedCategoryFilter, selectedLevelFilter, searchQuery]
  )

  const filterKey = `${selectedCategoryFilter ?? ''}|${selectedLevelFilter ?? ''}|${searchQuery}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setCurrentPage(1)
  }

  const totalItems = filteredSkills.length
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE
  const endIndex = Math.min(totalItems, startIndex + PAGE_SIZE)
  const paginatedSkills = filteredSkills.slice(startIndex, endIndex)

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedCategoryFilter || selectedLevelFilter != null
  )
  const handleClearAllFilters = () => {
    setSearchQuery('')
    onSelectCategoryFilter?.(null)
    onSelectLevelFilter?.(null)
  }

  if (allBlindSpots.length === 0) {
    return (
      <Paper
        id="sfia-blind-spots-table-container"
        withBorder
        p="md"
        radius="md"
        className={className}
      >
        <Stack align="center" gap="xs" ta="center">
          <ThemeIcon size="xl" radius="xl" variant="light" color="success">
            <IconCircleCheck size={24} stroke={1.5} />
          </ThemeIcon>
          <Title order={3} size="h4">
            Xuất sắc! Không còn điểm mù kỹ năng nào
          </Title>
          <Text size="sm" c="dimmed" maw={440}>
            100% kỹ năng SFIA 9 đều đã có ít nhất một câu hỏi phỏng vấn mẫu
            trong Ngân hàng câu hỏi.
          </Text>
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper
      id="sfia-blind-spots-table-container"
      withBorder
      radius="md"
      className={className}
    >
      <SfiaBlindSpotsToolbar
        totalBlindSpots={allBlindSpots.length}
        categories={categories}
        levels={levels}
        searchQuery={searchQuery}
        selectedCategoryFilter={selectedCategoryFilter}
        selectedLevelFilter={selectedLevelFilter}
        hasActiveFilters={hasActiveFilters}
        isExportingCsv={isExportingCsv}
        onSearchChange={setSearchQuery}
        onSelectCategoryFilter={onSelectCategoryFilter}
        onSelectLevelFilter={onSelectLevelFilter}
        onClearAllFilters={handleClearAllFilters}
        onExportCsv={onExportCsv}
      />
      <Divider />

      {totalItems === 0 ? (
        <Stack align="center" gap="xs" p="md" ta="center">
          <ThemeIcon size="lg" radius="xl" variant="light" color="neutral">
            <IconSearchOff size={20} stroke={1.5} />
          </ThemeIcon>
          <Title order={4} size="h5">
            Không tìm thấy điểm mù nào khớp bộ lọc
          </Title>
          <Text size="sm" c="dimmed" maw={400}>
            Thử điều chỉnh từ khóa tìm kiếm hoặc đặt lại bộ lọc danh mục và cấp
            độ.
          </Text>
          <Button
            variant="light"
            color="brand"
            size="sm"
            onClick={handleClearAllFilters}
          >
            Đặt lại bộ lọc
          </Button>
        </Stack>
      ) : (
        <>
          <Table.ScrollContainer minWidth={720}>
            <Table highlightOnHover verticalSpacing="xs" horizontalSpacing="xs">
              <Table.Thead className={surfaces.subtleSurface}>
                <Table.Tr>
                  <Table.Th>Mã kỹ năng</Table.Th>
                  <Table.Th>Tên kỹ năng</Table.Th>
                  <Table.Th>Danh mục SFIA</Table.Th>
                  <Table.Th ta="center">Dải cấp độ</Table.Th>
                  <Table.Th ta="center">Nhu cầu O*NET</Table.Th>
                  <Table.Th>Mức ưu tiên</Table.Th>
                  <Table.Th ta="right">Thao tác</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedSkills.map((skill) => (
                  <SfiaBlindSpotsRow
                    key={skill.code}
                    skill={skill}
                    categoryLabel={
                      categoryNameMap.get(skill.categoryCode) ??
                      skill.categoryCode
                    }
                    onCreateQuestion={onCreateQuestion}
                    onSelectSkill={onSelectSkill}
                  />
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          <Group
            justify="space-between"
            align="center"
            gap="xs"
            p="xs"
            wrap="wrap"
            className={surfaces.borderedTop}
          >
            <Text
              size="sm"
              c="dimmed"
              data-testid="pagination-summary"
              className={typography.tabularNums}
            >
              Hiển thị {startIndex + 1} - {endIndex} trong tổng số {totalItems}{' '}
              điểm mù
            </Text>
            {totalPages > 1 ? (
              <Pagination
                size="sm"
                total={totalPages}
                value={safePage}
                onChange={setCurrentPage}
                getItemProps={(page) => ({ 'aria-label': `Trang ${page}` })}
                getControlProps={getControlProps}
              />
            ) : null}
          </Group>
        </>
      )}
    </Paper>
  )
}
