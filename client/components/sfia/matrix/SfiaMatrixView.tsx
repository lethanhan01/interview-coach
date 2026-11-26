'use client'

import { Fragment, useMemo, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { IconChevronRight, IconSearchOff } from '@tabler/icons-react'
import type {
  SfiaCategory,
  SfiaLevelResponsibility,
  SfiaMatrixCellData,
  SfiaMatrixDisplayMode,
  SfiaSkillSummary,
} from '@/types'
import { getSfiaCategorySemanticTheme } from '@/components/sfia/sfia-theme'
import interactions from '@/styles/interactions.module.css'
import surfaces from '@/styles/surfaces.module.css'
import sfia from '../sfia.module.css'
import { SfiaMatrixHeatmapSummary } from './SfiaMatrixHeatmapSummary'
import { SfiaMatrixRow } from './SfiaMatrixRow'

const SFIA_LEVELS = [1, 2, 3, 4, 5, 6, 7] as const

export interface SfiaMatrixViewProps {
  skills: SfiaSkillSummary[]
  categories: SfiaCategory[]
  cells: Record<string, SfiaMatrixCellData>
  levels?: SfiaLevelResponsibility[]
  displayMode?: SfiaMatrixDisplayMode
  blindSpotsOnly?: boolean
  onBlindSpotsOnlyChange?: (enabled: boolean) => void
  inspectedCell?: { skillCode: string; levelId: number } | null
  onSelectCell: (skillCode: string, levelId: number) => void
  onClearFilters?: () => void
  filterKey?: string
  className?: string
}

export function SfiaMatrixView({
  skills,
  categories,
  cells,
  levels,
  displayMode = 'level',
  blindSpotsOnly = false,
  onBlindSpotsOnlyChange,
  inspectedCell = null,
  onSelectCell,
  onClearFilters,
  filterKey = '',
  className,
}: Readonly<SfiaMatrixViewProps>) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    () => new Set()
  )
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)

  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    if (filterKey && filterKey !== '::' && collapsedCategories.size > 0) {
      setCollapsedCategories(new Set())
    }
  }
  const filteredSkills = useMemo(() => {
    if (!blindSpotsOnly) return skills
    return skills.filter((skill) => {
      for (let lvl = skill.minLevel; lvl <= skill.maxLevel; lvl++) {
        const cell = cells[`${skill.code}_L${lvl}`]
        if (!cell || cell.questionCount === 0) return true
      }
      return false
    })
  }, [skills, cells, blindSpotsOnly])

  const groupedSkills = useMemo(() => {
    const map = new Map<string, SfiaSkillSummary[]>()
    for (const cat of categories) map.set(cat.code, [])
    for (const skill of filteredSkills) {
      const list = map.get(skill.categoryCode)
      if (list) list.push(skill)
      else map.set(skill.categoryCode, [skill])
    }
    return map
  }, [categories, filteredSkills])

  const levelNameMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const lvl of levels ?? []) map.set(lvl.levelId, lvl.nameVi || lvl.name)
    return map
  }, [levels])

  const visibleCategoryCodes = useMemo(
    () =>
      categories
        .filter((cat) => (groupedSkills.get(cat.code)?.length ?? 0) > 0)
        .map((cat) => cat.code),
    [categories, groupedSkills]
  )

  const allCollapsed =
    visibleCategoryCodes.length > 0 &&
    visibleCategoryCodes.every((code) => collapsedCategories.has(code))

  const toggleCategory = (categoryCode: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryCode)) {
        next.delete(categoryCode)
      } else {
        next.add(categoryCode)
      }
      return next
    })
  }

  const handleToggleAllCategories = () => {
    if (allCollapsed) {
      setCollapsedCategories(new Set())
    } else {
      setCollapsedCategories(new Set(visibleCategoryCodes))
    }
  }

  if (filteredSkills.length === 0) {
    return (
      <Paper
        withBorder
        radius="md"
        p="md"
        data-testid="matrix-empty-state"
        className={className}
      >
        <Stack align="center" gap="xs" py="lg">
          <ThemeIcon size="xl" radius="xl" variant="light" color="neutral">
            <IconSearchOff size={24} stroke={1.5} />
          </ThemeIcon>
          <Title order={3} fz="md" fw={700} ta="center">
            {blindSpotsOnly
              ? 'Không phát hiện điểm mù nào trong nhóm lọc hiện tại'
              : 'Không tìm thấy kỹ năng SFIA phù hợp'}
          </Title>
          <Text size="sm" c="dimmed" ta="center" maw={420}>
            {blindSpotsOnly
              ? 'Tất cả các ô năng lực trong phạm vi lọc hiện tại đều đã có ít nhất một câu hỏi phỏng vấn.'
              : 'Hãy thử điều chỉnh từ khóa tìm kiếm hoặc chọn danh mục khác để xem kết quả.'}
          </Text>
          {onClearFilters && (
            <Button variant="default" size="sm" onClick={onClearFilters}>
              Xóa bộ lọc
            </Button>
          )}
        </Stack>
      </Paper>
    )
  }

  return (
    <Box className={[sfia.matrixPageRoot, className].filter(Boolean).join(' ')}>
      <SfiaMatrixHeatmapSummary
        skills={filteredSkills}
        cells={cells}
        blindSpotsOnly={blindSpotsOnly}
        onToggleBlindSpotsOnly={onBlindSpotsOnlyChange}
        allCollapsed={allCollapsed}
        onToggleAllCategories={
          visibleCategoryCodes.length > 0
            ? handleToggleAllCategories
            : undefined
        }
      />

      <Box className={sfia.matrixPageViewport}>
        <Table className={sfia.matrixPageTable} highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th
                scope="col"
                className={`${sfia.matrixPageStickyCorner} ${surfaces.subtleSurface} ${sfia.matrixCorner}`}
              >
                <Group justify="space-between" gap="xs" wrap="nowrap">
                  <Text size="sm" fw={700} truncate>
                    Kỹ năng SFIA 9
                  </Text>
                  <Text size="sm" c="dimmed">
                    ({filteredSkills.length})
                  </Text>
                </Group>
              </Table.Th>

              {SFIA_LEVELS.map((lvl) => {
                const label = levelNameMap.get(lvl)
                return (
                  <Table.Th
                    key={lvl}
                    scope="col"
                    className={`${sfia.matrixPageStickyHeader} ${surfaces.subtleSurface} ${sfia.matrixHeader}`}
                  >
                    <Stack gap={0} align="center" miw={0}>
                      <Text size="sm" fw={700} ff="monospace">
                        L{lvl}
                      </Text>
                      {label && (
                        <Text
                          size="xs"
                          c="dimmed"
                          fw={400}
                          truncate
                          maw="100%"
                          title={label}
                        >
                          {label}
                        </Text>
                      )}
                    </Stack>
                  </Table.Th>
                )
              })}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {categories.map((category) => {
              const categorySkills = groupedSkills.get(category.code) ?? []
              if (categorySkills.length === 0) return null
              const theme = getSfiaCategorySemanticTheme(category.code)
              const CategoryIcon = theme.icon

              const isExpanded = !collapsedCategories.has(category.code)
              const categoryTitle = category.nameVi || category.name

              return (
                <Fragment key={category.code}>
                  <Table.Tr data-testid={`category-header-${category.code}`}>
                    <Table.Td
                      colSpan={8}
                      className={`${surfaces.subtleSurface} ${surfaces.borderedBottom} ${sfia.matrixCategoryCell}`}
                    >
                      <UnstyledButton
                        className={`${interactions.hoverRow} ${sfia.matrixCategoryToggle}`}
                        aria-expanded={isExpanded}
                        onClick={() => toggleCategory(category.code)}
                      >
                        <Group gap="xs" align="center" wrap="nowrap">
                          <IconChevronRight
                            size={15}
                            stroke={1.5}
                            className={sfia.treeChevron}
                            data-expanded={isExpanded ? 'true' : 'false'}
                            aria-hidden="true"
                          />
                          <ThemeIcon
                            color={theme.color}
                            variant="light"
                            size="sm"
                            radius="sm"
                          >
                            <CategoryIcon size={14} stroke={1.5} />
                          </ThemeIcon>
                          <Text size="sm" fw={700}>
                            {categoryTitle}
                          </Text>
                          <Badge
                            color={theme.color}
                            variant={theme.badgeVariant}
                            size="sm"
                          >
                            {categorySkills.length} kỹ năng
                          </Badge>
                        </Group>
                      </UnstyledButton>
                    </Table.Td>
                  </Table.Tr>

                  {isExpanded &&
                    categorySkills.map((skill) => (
                      <SfiaMatrixRow
                        key={skill.code}
                        skill={skill}
                        cells={cells}
                        displayMode={displayMode}
                        levels={levels}
                        inspectedCell={inspectedCell}
                        onSelectCell={onSelectCell}
                      />
                    ))}
                </Fragment>
              )
            })}
          </Table.Tbody>
        </Table>
      </Box>
    </Box>
  )
}
