'use client'

import { useState } from 'react'
import {
  Badge,
  Button,
  Combobox,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  useCombobox,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  IconBriefcase,
  IconSearch,
  IconSparkles,
  IconX,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { onetQueries } from '@/lib/query-client'
import type { OnetOccupation } from '@/types'
import classes from './OnetOccupationPicker.module.css'

export interface OnetOccupationPickerProps {
  socCode?: string
  occupationTitle?: string
  label: string
  helperText?: string
  placeholder?: string
  codePrefix?: string
  clearLabel?: string
  clearAriaLabel?: string
  inputId?: string
  disabled?: boolean
  onSelect: (occupation: OnetOccupation) => void
  onClear: () => void
}

export default function OnetOccupationPicker({
  socCode,
  occupationTitle,
  label,
  helperText,
  placeholder = 'Tìm kiếm chức danh O*NET (VD: Software Developers, Data Scientists...)',
  codePrefix = 'Mã SOC',
  clearLabel = 'Bỏ chọn',
  clearAriaLabel = 'Bỏ chọn chức danh O*NET',
  inputId = 'onet-occupation-picker',
  disabled = false,
  onSelect,
  onClear,
}: Readonly<OnetOccupationPickerProps>) {
  const [query, setQuery] = useState('')
  const [debouncedQuery] = useDebouncedValue(query, 250)
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })

  const { data: results = [], isFetching } = useQuery({
    ...onetQueries.search(debouncedQuery, 8),
    enabled: !disabled && combobox.dropdownOpened,
  })

  function handleOptionSubmit(selectedSoc: string) {
    const match = results.find((item) => item.socCode === selectedSoc)
    if (!match) return
    onSelect(match)
    setQuery('')
    combobox.closeDropdown()
  }

  return (
    <Stack gap={6}>
      <Group justify="space-between" align="center" gap="xs" wrap="wrap">
        <Text component="label" htmlFor={inputId} size="sm" fw={500}>
          {label}
        </Text>
        {helperText ? (
          <Group gap={4} wrap="nowrap">
            <IconSparkles size={13} stroke={1.5} aria-hidden="true" />
            <Text size="xs" c="brand" fw={500}>
              {helperText}
            </Text>
          </Group>
        ) : null}
      </Group>

      {socCode && occupationTitle ? (
        <Paper withBorder radius="md" p="sm" className={classes.selectedCard}>
          <Group justify="space-between" align="center" gap="sm" wrap="nowrap">
            <Group gap="sm" align="center" wrap="nowrap" flex={1} miw={0}>
              <ThemeIcon size={34} radius="md" variant="filled" color="brand">
                <IconBriefcase size={16} stroke={1.5} aria-hidden="true" />
              </ThemeIcon>
              <Stack gap={2} flex={1} miw={0}>
                <Text size="sm" fw={600} truncate>
                  {occupationTitle}
                </Text>
                <Text size="xs" c="dimmed" className={classes.mono}>
                  {codePrefix}: {socCode}
                </Text>
              </Stack>
            </Group>

            <Button
              type="button"
              variant="subtle"
              color="neutral"
              size="xs"
              disabled={disabled}
              aria-label={clearAriaLabel}
              leftSection={<IconX size={14} stroke={1.5} aria-hidden="true" />}
              onClick={onClear}
            >
              {clearLabel}
            </Button>
          </Group>
        </Paper>
      ) : (
        <Combobox store={combobox} onOptionSubmit={handleOptionSubmit}>
          <Combobox.Target>
            <TextInput
              id={inputId}
              type="search"
              disabled={disabled}
              value={query}
              placeholder={placeholder}
              aria-label="Tìm kiếm chức danh chuẩn O*NET"
              onChange={(event) => {
                setQuery(event.currentTarget.value)
                combobox.openDropdown()
              }}
              onFocus={() => combobox.openDropdown()}
              onClick={() => combobox.openDropdown()}
              rightSection={
                isFetching ? (
                  <Loader size={16} color="brand" />
                ) : (
                  <IconSearch size={16} stroke={1.5} aria-hidden="true" />
                )
              }
            />
          </Combobox.Target>

          <Combobox.Dropdown>
            <Combobox.Options>
              <ScrollArea.Autosize mah={240} type="scroll">
                {isFetching && results.length === 0 ? (
                  <Combobox.Empty>
                    <Group justify="center" gap="xs" py="xs">
                      <Loader size={14} color="brand" />
                      <Text size="xs" c="dimmed">
                        Đang tìm kiếm chức danh O*NET...
                      </Text>
                    </Group>
                  </Combobox.Empty>
                ) : results.length === 0 ? (
                  <Combobox.Empty>
                    <Text size="xs" c="dimmed">
                      {query.trim()
                        ? 'Không tìm thấy chức danh O*NET phù hợp.'
                        : 'Gõ để tìm kiếm chức danh O*NET...'}
                    </Text>
                  </Combobox.Empty>
                ) : (
                  results.map((occ) => (
                    <Combobox.Option key={occ.socCode} value={occ.socCode}>
                      <Group
                        justify="space-between"
                        align="flex-start"
                        gap="xs"
                        wrap="nowrap"
                      >
                        <Stack gap={2} flex={1} miw={0}>
                          <Text size="sm" fw={500} truncate>
                            {occ.title}
                          </Text>
                          {occ.matchedTitle &&
                          occ.matchedTitle !== occ.title ? (
                            <Text size="xs" c="dimmed" truncate>
                              Khớp với: {occ.matchedTitle}
                            </Text>
                          ) : occ.description ? (
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {occ.description}
                            </Text>
                          ) : null}
                        </Stack>
                        <Badge
                          variant="outline"
                          color="neutral"
                          size="xs"
                          className={classes.mono}
                        >
                          {occ.socCode}
                        </Badge>
                      </Group>
                    </Combobox.Option>
                  ))
                )}
              </ScrollArea.Autosize>
            </Combobox.Options>
          </Combobox.Dropdown>
        </Combobox>
      )}
    </Stack>
  )
}
