'use client'

import { Badge, Group, Text, VisuallyHidden } from '@mantine/core'
import { IconClock } from '@tabler/icons-react'
import { useCountdown } from '@/hooks/useCountdown'

export interface CountdownTimerProps {
  initialSeconds: number
  active: boolean
  onChange?: (remainingSeconds: number) => void
  onExpire?: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getTimerColor(
  isExpired: boolean,
  isWarning: boolean
): 'danger' | 'warning' | 'neutral' {
  if (isExpired) return 'danger'
  if (isWarning) return 'warning'
  return 'neutral'
}

function getMilestoneAnnouncement(
  remainingSeconds: number,
  active: boolean,
  isExpired: boolean
): string {
  if (isExpired) {
    return 'Đã hết thời gian phỏng vấn'
  }
  if (!active) {
    return ''
  }
  if (remainingSeconds <= 60) {
    return 'Cảnh báo: Còn dưới 1 phút phỏng vấn'
  }
  if (remainingSeconds <= 300) {
    return 'Cảnh báo: Còn dưới 5 phút phỏng vấn'
  }
  return ''
}

export default function CountdownTimer({
  initialSeconds,
  active,
  onChange,
  onExpire,
}: Readonly<CountdownTimerProps>) {
  const { remainingSeconds, isWarning, isExpired } = useCountdown(
    initialSeconds,
    active,
    onChange,
    onExpire
  )

  const badgeColor = getTimerColor(isExpired, isWarning)
  const announcement = getMilestoneAnnouncement(
    remainingSeconds,
    active,
    isExpired
  )

  return (
    <Group gap="xs" align="center" wrap="nowrap">
      <Badge
        size="lg"
        variant="light"
        radius="md"
        color={badgeColor}
        leftSection={<IconClock size={16} stroke={1.5} aria-hidden="true" />}
      >
        <Group gap={6} wrap="nowrap">
          <Text component="span" size="xs" fw={500}>
            Còn lại
          </Text>
          <Text component="span" size="sm" ff="monospace" fw={700}>
            {formatTime(remainingSeconds)}
          </Text>
        </Group>
      </Badge>

      <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </VisuallyHidden>
    </Group>
  )
}
