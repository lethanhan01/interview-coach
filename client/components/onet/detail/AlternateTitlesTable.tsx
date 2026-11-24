'use client'

import {
  ActionIcon,
  Button,
  CopyButton,
  Group,
  Highlight,
  Pagination,
  Paper,
  Stack,
  Table,
  Text,
  Tooltip,
} from '@mantine/core'
import { IconCheck, IconCopy } from '@tabler/icons-react'

export interface AlternateTitlesTableProps {
  items: string[]
  searchQuery: string
  currentPage: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function AlternateTitlesTable({
  items,
  searchQuery,
  currentPage,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: Readonly<AlternateTitlesTableProps>) {
  const allPageTitles = items.join('\n')

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center" wrap="wrap">
        <Text size="xs" c="dimmed">
          Hiển thị {(currentPage - 1) * pageSize + 1} -{' '}
          {Math.min(currentPage * pageSize, total)} trong tổng số {total} chức
          danh
        </Text>

        <CopyButton value={allPageTitles} timeout={2000}>
          {({ copied, copy }) => (
            <Button
              size="xs"
              variant="subtle"
              color={copied ? 'success' : 'neutral'}
              leftSection={
                copied ? (
                  <IconCheck size={14} stroke={1.5} />
                ) : (
                  <IconCopy size={14} stroke={1.5} />
                )
              }
              onClick={copy}
            >
              {copied ? 'Đã sao chép trang này' : 'Sao chép trang này'}
            </Button>
          )}
        </CopyButton>
      </Group>

      <Paper withBorder radius="md">
        <Table.ScrollContainer minWidth={350}>
          <Table verticalSpacing="xs" horizontalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={60}>STT</Table.Th>
                <Table.Th>Chức danh tương đương</Table.Th>
                <Table.Th w={80} ta="right">
                  Sao chép
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((title, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index + 1
                return (
                  <Table.Tr key={`${title}-${index}`}>
                    <Table.Td>
                      <Text size="xs" c="dimmed" ff="monospace">
                        #{globalIndex}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Highlight highlight={searchQuery} size="xs" fw={500}>
                        {title}
                      </Highlight>
                    </Table.Td>
                    <Table.Td ta="right">
                      <CopyButton value={title} timeout={2000}>
                        {({ copied, copy }) => (
                          <Tooltip
                            label={copied ? 'Đã sao chép' : 'Sao chép'}
                            withArrow
                          >
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              color={copied ? 'success' : 'neutral'}
                              onClick={copy}
                              aria-label={`Sao chép chức danh ${title}`}
                            >
                              {copied ? (
                                <IconCheck size={14} stroke={1.5} />
                              ) : (
                                <IconCopy size={14} stroke={1.5} />
                              )}
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                    </Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {totalPages > 1 ? (
        <Group justify="center" pt="xs">
          <Pagination
            total={totalPages}
            value={currentPage}
            onChange={onPageChange}
            size="xs"
          />
        </Group>
      ) : null}
    </Stack>
  )
}
