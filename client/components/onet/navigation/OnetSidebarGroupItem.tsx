'use client'

import {
  Accordion,
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Progress,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import interactions from '@/styles/interactions.module.css'
import layout from '@/styles/layout.module.css'
import typography from '@/styles/typography.module.css'
import type { OnetOccupationSummary, SocMajorGroup } from '@/types'
import onet from '../onet.module.css'

export interface OnetSidebarGroupItemProps {
  group: SocMajorGroup
  occupations: OnetOccupationSummary[]
  countLabel: number
  showProgress: boolean
  isLoading: boolean
  errorMessage: string | null
  onRetry: () => void
  selectedSoc: string
  onSelectSoc: (socCode: string) => void
}

export function OnetSidebarGroupItem({
  group,
  occupations,
  countLabel,
  showProgress,
  isLoading,
  errorMessage,
  onRetry,
  selectedSoc,
  onSelectSoc,
}: Readonly<OnetSidebarGroupItemProps>) {
  const coveragePercent =
    group.totalOccupations > 0
      ? Math.round((group.mappedCount / group.totalOccupations) * 100)
      : 0

  return (
    <Accordion.Item value={group.code}>
      <Accordion.Control>
        <Stack gap={4}>
          <Group justify="space-between" wrap="nowrap" gap="xs">
            <Group gap={6} wrap="nowrap" miw={0}>
              <Badge
                color="brand"
                variant="light"
                size="sm"
                className={layout.shrink0}
              >
                {group.code}
              </Badge>
              <Text size="sm" fw={600} lineClamp={1}>
                {group.name}
              </Text>
            </Group>
            {isLoading ? (
              <Loader size={14} />
            ) : (
              <Badge
                color="neutral"
                variant="light"
                size="sm"
                className={`${typography.tabularNums} ${layout.shrink0}`}
              >
                {countLabel}
              </Badge>
            )}
          </Group>

          {showProgress ? (
            <Group gap={6} wrap="nowrap">
              <Progress
                value={coveragePercent}
                color="success"
                size="xs"
                flex={1}
                aria-label={`Nhóm ${group.code} đã ánh xạ ${coveragePercent}%`}
              />
              <Text size="xs" c="dimmed" className={typography.tabularNums}>
                {group.mappedCount}/{group.totalOccupations}
              </Text>
            </Group>
          ) : null}
        </Stack>
      </Accordion.Control>

      <Accordion.Panel>
        {errorMessage ? (
          <Alert color="danger" variant="light" p="xs">
            <Stack gap={6}>
              <Text size="sm">{errorMessage}</Text>
              <Group>
                <Button
                  size="compact-sm"
                  variant="light"
                  color="danger"
                  leftSection={<IconRefresh size={13} stroke={1.5} />}
                  onClick={onRetry}
                >
                  Thử lại
                </Button>
              </Group>
            </Stack>
          </Alert>
        ) : isLoading && occupations.length === 0 ? (
          <Group justify="center" gap="xs" py="xs">
            <Loader size="xs" />
            <Text size="sm" c="dimmed">
              Đang tải danh sách nghề...
            </Text>
          </Group>
        ) : occupations.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="xs">
            Không có nghề phù hợp trong nhóm này
          </Text>
        ) : (
          <Stack gap={2}>
            {occupations.map((occ) => {
              const isSelected = occ.socCode === selectedSoc
              return (
                <UnstyledButton
                  key={occ.socCode}
                  className={`${interactions.selectableItem} ${onet.sidebarOccButton}`}
                  mod={{ selected: isSelected }}
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => onSelectSoc(occ.socCode)}
                >
                  <Stack gap={0} miw={0}>
                    <Text
                      size="xs"
                      c={isSelected ? 'brand' : 'dimmed'}
                      ff="monospace"
                    >
                      {occ.socCode}
                    </Text>
                    <Text size="sm" fw={isSelected ? 600 : 400} lineClamp={2}>
                      {occ.title}
                    </Text>
                  </Stack>
                  <Box
                    component="span"
                    role="status"
                    className={onet.sidebarStatusDot}
                    mod={{ mapped: occ.isMapped }}
                    title={
                      occ.isMapped
                        ? `Đã ánh xạ ${occ.mappingCount} kỹ năng SFIA`
                        : 'Chưa có ánh xạ SFIA'
                    }
                    aria-label={
                      occ.isMapped
                        ? `Đã ánh xạ ${occ.mappingCount} kỹ năng SFIA`
                        : 'Chưa có ánh xạ SFIA'
                    }
                  />
                </UnstyledButton>
              )
            })}
          </Stack>
        )}
      </Accordion.Panel>
    </Accordion.Item>
  )
}
