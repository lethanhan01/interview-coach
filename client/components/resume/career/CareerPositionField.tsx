'use client'

import { useMemo } from 'react'
import {
  Autocomplete,
  Button,
  Group,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useQuery } from '@tanstack/react-query'
import { onetQueries } from '@/queries/onet.queries'

export interface CareerPositionFieldProps {
  value: string
  error?: React.ReactNode
  disabled?: boolean
  onChange: (value: string) => void
}

export default function CareerPositionField({
  value,
  error,
  disabled = false,
  onChange,
}: Readonly<CareerPositionFieldProps>) {
  const [debouncedQuery] = useDebouncedValue(value.trim(), 250)

  const popularQuery = useQuery(onetQueries.search('', 5))
  const searchQuery = useQuery({
    ...onetQueries.search(debouncedQuery, 15),
    enabled: debouncedQuery.length > 0,
  })

  const autocompleteData = useMemo(() => {
    const source =
      debouncedQuery.length > 0
        ? (searchQuery.data ?? [])
        : (popularQuery.data ?? [])
    return Array.from(
      new Set(source.map((occ) => occ.title.trim()).filter(Boolean))
    )
  }, [debouncedQuery, searchQuery.data, popularQuery.data])

  const popularPositions = popularQuery.data?.slice(0, 5) ?? []

  return (
    <Stack gap={6}>
      <Autocomplete
        id="target-position"
        label="Vị trí mục tiêu (Tên hiển thị)"
        placeholder="VD: Senior Frontend Engineer, Full-stack Developer..."
        data={autocompleteData}
        value={value}
        error={error}
        disabled={disabled}
        onChange={onChange}
      />

      {popularQuery.isPending ? (
        <Group gap={6} wrap="wrap" align="center">
          <Text size="xs" c="dimmed">
            Vị trí IT phổ biến:
          </Text>
          <Skeleton h={22} w={110} radius="sm" />
          <Skeleton h={22} w={120} radius="sm" />
          <Skeleton h={22} w={100} radius="sm" />
        </Group>
      ) : popularQuery.isError ? (
        <Group gap={6} wrap="wrap" align="center">
          <Text size="xs" c="danger">
            Không thể tải gợi ý vị trí phổ biến.
          </Text>
          <Button
            type="button"
            variant="subtle"
            color="danger"
            size="compact-xs"
            onClick={() => void popularQuery.refetch()}
          >
            Thử lại
          </Button>
        </Group>
      ) : popularPositions.length > 0 ? (
        <Group gap={6} wrap="wrap" align="center">
          <Text size="xs" c="dimmed">
            Vị trí IT phổ biến:
          </Text>
          {popularPositions.map((occ) => (
            <Button
              key={occ.socCode}
              type="button"
              variant="light"
              color="brand"
              size="compact-xs"
              disabled={disabled}
              onClick={() => onChange(occ.title)}
            >
              {occ.title}
            </Button>
          ))}
        </Group>
      ) : null}
    </Stack>
  )
}
