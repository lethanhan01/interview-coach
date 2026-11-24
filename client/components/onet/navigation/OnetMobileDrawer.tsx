'use client'

import { useDisclosure } from '@mantine/hooks'
import {
  Badge,
  Button,
  Drawer,
  Group,
  Paper,
  Stack,
  Text,
} from '@mantine/core'
import { IconListDetails } from '@tabler/icons-react'
import { OnetSidebar } from './OnetSidebar'

export interface OnetMobileDrawerProps {
  selectedSoc: string
  selectedTitle?: string
  onSelectSoc: (socCode: string) => void
  refreshTrigger?: number
}

export function OnetMobileDrawer({
  selectedSoc,
  selectedTitle,
  onSelectSoc,
  refreshTrigger = 0,
}: Readonly<OnetMobileDrawerProps>) {
  const [opened, { open, close }] = useDisclosure(false)

  return (
    <>
      <Paper withBorder p="xs" radius="md" hiddenFrom="lg">
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Stack gap={0} miw={0}>
            <Group gap={6} wrap="nowrap">
              <Badge color="brand" variant="outline" size="xs">
                {selectedSoc}
              </Badge>
              {selectedTitle ? (
                <Text size="xs" fw={600} lineClamp={1}>
                  {selectedTitle}
                </Text>
              ) : null}
            </Group>
          </Stack>
          <Button
            size="xs"
            variant="light"
            leftSection={<IconListDetails size={14} stroke={1.5} />}
            onClick={open}
          >
            Danh mục nghề
          </Button>
        </Group>
      </Paper>

      <Drawer
        opened={opened}
        onClose={close}
        position="left"
        size="85%"
        padding={0}
        title="Danh mục nghề nghiệp O*NET"
        hiddenFrom="lg"
      >
        <OnetSidebar
          selectedSoc={selectedSoc}
          onSelectSoc={(socCode) => {
            onSelectSoc(socCode)
            close()
          }}
          refreshTrigger={refreshTrigger}
        />
      </Drawer>
    </>
  )
}
