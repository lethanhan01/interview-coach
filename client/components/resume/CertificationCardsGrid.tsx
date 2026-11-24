'use client'

import {
  ActionIcon,
  Badge,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import ProfileEmptyState from '@/components/profile/ProfileEmptyState'
import type { AwardEntry, CertificationEntry } from '@/types'
import { formatResumeFullDate } from './resume-schemas'

export function CertificationCardsGrid({
  items,
  emptyText,
  onEdit,
  onDelete,
}: Readonly<{
  items: CertificationEntry[]
  emptyText: string
  onEdit: (cert: CertificationEntry) => void
  onDelete: (cert: CertificationEntry) => void
}>) {
  if (items.length === 0) return <ProfileEmptyState message={emptyText} />

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      {items.map((cert) => {
        const issued = formatResumeFullDate(cert.issueDate)
        const expired = formatResumeFullDate(cert.expiryDate)
        return (
          <Card key={cert.id} withBorder radius="md" p="md">
            <Stack gap={6}>
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Stack gap={2} flex={1} miw={0}>
                  <Group gap="xs" wrap="wrap">
                    <Text size="sm" fw={600}>
                      {cert.name}
                    </Text>
                    {cert.score ? (
                      <Badge variant="light" color="success" size="xs">
                        {cert.score}
                      </Badge>
                    ) : null}
                  </Group>
                  <Text size="xs" c="dimmed">
                    {cert.issuer}
                  </Text>
                </Stack>
                <Group gap={4} wrap="nowrap">
                  <ActionIcon
                    variant="subtle"
                    color="neutral"
                    size="sm"
                    aria-label={`Chỉnh sửa chứng chỉ ${cert.name}`}
                    onClick={() => onEdit(cert)}
                  >
                    <IconPencil size={15} stroke={1.5} aria-hidden="true" />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="danger"
                    size="sm"
                    aria-label={`Xóa chứng chỉ ${cert.name}`}
                    onClick={() => onDelete(cert)}
                  >
                    <IconTrash size={15} stroke={1.5} aria-hidden="true" />
                  </ActionIcon>
                </Group>
              </Group>
              {issued || expired ? (
                <Text size="xs" c="dimmed">
                  {issued}
                  {expired ? ` → ${expired}` : ''}
                </Text>
              ) : null}
            </Stack>
          </Card>
        )
      })}
    </SimpleGrid>
  )
}

export function AwardCardsGrid({
  items,
  onEdit,
  onDelete,
}: Readonly<{
  items: AwardEntry[]
  onEdit: (award: AwardEntry) => void
  onDelete: (award: AwardEntry) => void
}>) {
  if (items.length === 0) {
    return <ProfileEmptyState message="Chưa thêm giải thưởng" />
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      {items.map((award) => (
        <Card key={award.id} withBorder radius="md" p="md">
          <Stack gap={6}>
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={2} flex={1} miw={0}>
                <Text size="sm" fw={600}>
                  {award.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {[award.organization, formatResumeFullDate(award.date)]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </Stack>
              <Group gap={4} wrap="nowrap">
                <ActionIcon
                  variant="subtle"
                  color="neutral"
                  size="sm"
                  aria-label={`Chỉnh sửa giải thưởng ${award.name}`}
                  onClick={() => onEdit(award)}
                >
                  <IconPencil size={15} stroke={1.5} aria-hidden="true" />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="danger"
                  size="sm"
                  aria-label={`Xóa giải thưởng ${award.name}`}
                  onClick={() => onDelete(award)}
                >
                  <IconTrash size={15} stroke={1.5} aria-hidden="true" />
                </ActionIcon>
              </Group>
            </Group>
            {award.description ? (
              <Text size="xs" c="dimmed">
                {award.description}
              </Text>
            ) : null}
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  )
}
