import type { ReactNode } from 'react'
import { Card, Group, Stack, Title } from '@mantine/core'

export interface ProfileSectionProps {
  title: string
  action?: ReactNode
  children: ReactNode
}

export default function ProfileSection({
  title,
  action,
  children,
}: Readonly<ProfileSectionProps>) {
  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="center" gap="sm" wrap="wrap">
          <Title order={2} size="h4">
            {title}
          </Title>
          {action}
        </Group>
        {children}
      </Stack>
    </Card>
  )
}
