'use client'

import {
  Badge,
  Box,
  Button,
  Group,
  Highlight,
  Stack,
  Table,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import type { SfiaLevelResponsibility, SfiaGenericAttribute } from '@/types'
import {
  getSfiaAttributeSemanticTheme,
  getSfiaLevelSemanticTheme,
} from '@/components/sfia/sfia-theme'
import classes from './SfiaAttributesProgressionMatrix.module.css'

export interface SfiaProgressionTableProps {
  levels: SfiaLevelResponsibility[]
  attributes: SfiaGenericAttribute[]
  totalAttributesCount: number
  selectedLevel: number
  searchQuery: string
  onSelectLevel: (levelId: number) => void
  onClearSearch: () => void
}

export function SfiaProgressionTable({
  levels,
  attributes,
  totalAttributesCount,
  selectedLevel,
  searchQuery,
  onSelectLevel,
  onClearSearch,
}: Readonly<SfiaProgressionTableProps>) {
  const trimmedQuery = searchQuery.trim()
  const normalizedQuery = trimmedQuery.toLowerCase()

  return (
    <Box className={classes.tableViewport}>
      <Table
        className={classes.matrixTable}
        verticalSpacing="xs"
        horizontalSpacing="xs"
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th scope="col" className={classes.stickyCorner}>
              <Group justify="space-between" gap="xs" wrap="nowrap">
                <Text size="sm" fw={700}>
                  5 Thuộc tính Chung
                </Text>
                <Badge color="neutral" variant="light" size="sm">
                  {attributes.length}/{totalAttributesCount}
                </Badge>
              </Group>
            </Table.Th>

            {levels.map((lvl) => {
              const isSelected = lvl.levelId === selectedLevel
              const theme = getSfiaLevelSemanticTheme(lvl.levelId)
              const title = lvl.nameVi || lvl.name
              const headerLabel = `Cấp độ ${lvl.levelId}: ${title}`

              return (
                <Table.Th
                  key={lvl.levelId}
                  scope="col"
                  aria-label={headerLabel}
                  className={classes.stickyHeader}
                  mod={{ selected: isSelected }}
                >
                  <UnstyledButton
                    className={classes.levelHeaderBtn}
                    onClick={() => onSelectLevel(lvl.levelId)}
                    aria-pressed={isSelected}
                    aria-label={headerLabel}
                  >
                    <Group
                      justify="space-between"
                      gap="xs"
                      wrap="nowrap"
                      w="100%"
                    >
                      <Group gap={6} wrap="nowrap">
                        <Badge
                          color={theme.color}
                          variant={isSelected ? 'filled' : theme.badgeVariant}
                          size="sm"
                        >
                          L{lvl.levelId}
                        </Badge>
                        <Text
                          size="sm"
                          fw={700}
                          c={isSelected ? 'brand' : undefined}
                          lineClamp={1}
                        >
                          {title}
                        </Text>
                      </Group>
                      {isSelected && (
                        <Badge color="brand" variant="light" size="xs">
                          Đang chọn
                        </Badge>
                      )}
                    </Group>
                    <Text
                      size="xs"
                      c="dimmed"
                      fs="italic"
                      fw={400}
                      lineClamp={2}
                    >
                      &quot;{lvl.essence}&quot;
                    </Text>
                  </UnstyledButton>
                </Table.Th>
              )
            })}
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {attributes.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={levels.length + 1} p="md" ta="center">
                <Stack gap="xs" align="center">
                  <Text size="sm" c="dimmed">
                    Không tìm thấy thuộc tính nào khớp với &quot;{searchQuery}
                    &quot;.
                  </Text>
                  <Button variant="light" size="sm" onClick={onClearSearch}>
                    Xóa từ khóa tìm kiếm
                  </Button>
                </Stack>
              </Table.Td>
            </Table.Tr>
          ) : (
            attributes.map((attr) => {
              const attrTheme = getSfiaAttributeSemanticTheme(attr.code)
              const Icon = attrTheme.icon

              return (
                <Table.Tr key={attr.code}>
                  <Table.Th scope="row" className={classes.stickyAttrCol}>
                    <Stack gap={4}>
                      <Group gap="xs" wrap="nowrap">
                        <ThemeIcon
                          color={attrTheme.color}
                          variant="light"
                          size="sm"
                          radius="sm"
                        >
                          <Icon size={15} stroke={1.5} />
                        </ThemeIcon>
                        <Text size="sm" fw={700} lh={1.3}>
                          {attr.nameVi || attr.name}
                        </Text>
                      </Group>
                      <Group gap={6} wrap="wrap">
                        <Badge
                          color={attrTheme.color}
                          variant={attrTheme.badgeVariant}
                          size="xs"
                        >
                          {attr.code}
                        </Badge>
                        {attr.nameVi && attr.name !== attr.nameVi && (
                          <Text size="xs" c="dimmed">
                            {attr.name}
                          </Text>
                        )}
                      </Group>
                      <Text
                        size="xs"
                        c="dimmed"
                        fw={400}
                        lineClamp={3}
                        lh={1.45}
                      >
                        {attr.description}
                      </Text>
                    </Stack>
                  </Table.Th>

                  {levels.map((lvl) => {
                    const statement = attr.levels[lvl.levelId] || '—'
                    const isSelected = lvl.levelId === selectedLevel
                    const isMatched =
                      normalizedQuery !== '' &&
                      statement.toLowerCase().includes(normalizedQuery)

                    return (
                      <Table.Td
                        key={lvl.levelId}
                        className={classes.statementCell}
                        mod={{ selected: isSelected, matched: isMatched }}
                      >
                        <Stack gap={4}>
                          <Group justify="space-between" gap="xs">
                            <Text size="xs" fw={700} c="dimmed" ff="monospace">
                              L{lvl.levelId}
                            </Text>
                            {isSelected && (
                              <Badge color="brand" variant="light" size="xs">
                                Đang chọn
                              </Badge>
                            )}
                          </Group>
                          <Highlight
                            highlight={trimmedQuery}
                            color="warning"
                            size="sm"
                            lh={1.55}
                            fw={isSelected ? 500 : 400}
                          >
                            {statement}
                          </Highlight>
                        </Stack>
                      </Table.Td>
                    )
                  })}
                </Table.Tr>
              )
            })
          )}
        </Table.Tbody>
      </Table>
    </Box>
  )
}
