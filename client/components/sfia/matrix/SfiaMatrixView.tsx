'use client'

import { Fragment, useMemo } from 'react'
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
} from '@mantine/core'
import { IconSearchOff } from '@tabler/icons-react'
import type {
  SfiaCategory,
  SfiaLevelResponsibility,
  SfiaMatrixCellData,
  SfiaMatrixDisplayMode,
  SfiaSkillSummary,
} from '@/types'
import { getSfiaCategorySemanticTheme } from '@/components/sfia/sfia-theme'
import { SfiaMatrixHeatmapSummary } from './SfiaMatrixHeatmapSummary'
import { SfiaMatrixRow } from './SfiaMatrixRow'
import classes from './SfiaMatrixView.module.css'

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
  className,
}: Readonly<SfiaMatrixViewProps>) {
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

  if (filteredSkills.length === 0) {
    return (
      <Paper
        withBorder
        radius="md"
        p="xl"
        data-testid="matrix-empty-state"
        className={className}
      >
        <Stack align="center" gap="sm" py="xl">
          <ThemeIcon size="xl" radius="xl" variant="light" color="neutral">
            <IconSearchOff size={24} stroke={1.5} />
          </ThemeIcon>
          <Title order={3} fz="sm" fw={700} ta="center">
            {blindSpotsOnly
              ? 'Không phát hiện điểm mù nào trong nhóm lọc hiện tại'
              : 'Không tìm thấy kỹ năng SFIA phù hợp'}
          </Title>
          <Text size="xs" c="dimmed" ta="center" maw={380}>
            {blindSpotsOnly
              ? 'Tất cả các ô năng lực trong phạm vi lọc hiện tại đều đã có ít nhất một câu hỏi phỏng vấn.'
              : 'Hãy thử điều chỉnh từ khóa tìm kiếm hoặc chọn danh mục khác để xem kết quả.'}
          </Text>
          {onClearFilters && (
            <Button variant="default" size="xs" onClick={onClearFilters}>
              Xóa bộ lọc
            </Button>
          )}
        </Stack>
      </Paper>
    )
  }

  return (
    <Box className={[classes.root, className].filter(Boolean).join(' ')}>
      <SfiaMatrixHeatmapSummary
        skills={filteredSkills}
        cells={cells}
        blindSpotsOnly={blindSpotsOnly}
        onToggleBlindSpotsOnly={onBlindSpotsOnlyChange}
      />

      <Box className={classes.tableViewport}>
        <Table className={classes.matrixTable} highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th scope="col" className={classes.stickyCorner}>
                <Group justify="space-between" gap="xs" wrap="nowrap">
                  <Text size="xs" fw={700}>
                    Kỹ năng SFIA 9
                  </Text>
                  <Text size="xs" c="dimmed">
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
                    className={classes.stickyHeader}
                  >
                    <Stack gap={0} align="center">
                      <Text size="xs" fw={700} ff="monospace">
                        L{lvl}
                      </Text>
                      {label && (
                        <Text
                          size="xs"
                          c="dimmed"
                          fw={400}
                          truncate
                          maw={84}
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

              return (
                <Fragment key={category.code}>
                  <Table.Tr data-testid={`category-header-${category.code}`}>
                    <Table.Td colSpan={8} className={classes.categoryBanner}>
                      <Group gap="xs" align="center" wrap="nowrap">
                        <ThemeIcon
                          color={theme.color}
                          variant="light"
                          size="xs"
                          radius="sm"
                        >
                          <CategoryIcon size={12} stroke={1.5} />
                        </ThemeIcon>
                        <Text size="xs" fw={700}>
                          {category.nameVi || category.name}
                        </Text>
                        <Badge
                          color={theme.color}
                          variant={theme.badgeVariant}
                          size="xs"
                        >
                          {categorySkills.length} kỹ năng
                        </Badge>
                      </Group>
                    </Table.Td>
                  </Table.Tr>

                  {categorySkills.map((skill) => (
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
