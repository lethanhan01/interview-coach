'use client'

import { useDisclosure } from '@mantine/hooks'
import { Badge, Button, Group, Stack, Text } from '@mantine/core'
import { IconListDetails } from '@tabler/icons-react'
import { AdminMobileSidebarDrawer } from '@/components/admin/shared/AdminMobileSidebarDrawer'
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
    <AdminMobileSidebarDrawer
      opened={opened}
      onClose={close}
      drawerPosition="left"
      drawerSize="85%"
      drawerPadding={0}
      drawerTitle="Danh mục nghề nghiệp O*NET"
      triggerBar={
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Stack gap={0} miw={0}>
            <Group gap={6} wrap="nowrap">
              <Badge color="brand" variant="outline" size="sm">
                {selectedSoc}
              </Badge>
              {selectedTitle ? (
                <Text size="sm" fw={600} lineClamp={1}>
                  {selectedTitle}
                </Text>
              ) : null}
            </Group>
          </Stack>
          <Button
            size="sm"
            variant="light"
            leftSection={<IconListDetails size={15} stroke={1.5} />}
            onClick={open}
          >
            Danh mục nghề
          </Button>
        </Group>
      }
    >
      <OnetSidebar
        selectedSoc={selectedSoc}
        onSelectSoc={(socCode) => {
          onSelectSoc(socCode)
          close()
        }}
        refreshTrigger={refreshTrigger}
      />
    </AdminMobileSidebarDrawer>
  )
}
