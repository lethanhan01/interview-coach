'use client'

import { ActionIcon, Badge, Button, Group, Paper } from '@mantine/core'
import {
  IconCircleX,
  IconFlagCheck,
  IconPlayerPause,
  IconRefresh,
} from '@tabler/icons-react'
import CountdownTimer from '@/components/interview/CountdownTimer'
import type { ConnectionState } from '@/hooks/useSessionEvents'
import type { SessionStatusAction } from '@/types'

export interface SessionHeaderBarProps {
  remainingSeconds: number
  isTimerActive: boolean
  questionsReady: boolean
  isCompleting: boolean
  isVoiceBusy: boolean
  statusAction: SessionStatusAction | null
  connectionState: ConnectionState
  onRemainingChange: (seconds: number) => void
  onExpire: () => void
  onPause: () => void
  onEarlyFinish: () => void
  onCancel: () => void
  onReconnect: () => void
}

export default function SessionHeaderBar({
  remainingSeconds,
  isTimerActive,
  questionsReady,
  isCompleting,
  isVoiceBusy,
  statusAction,
  connectionState,
  onRemainingChange,
  onExpire,
  onPause,
  onEarlyFinish,
  onCancel,
  onReconnect,
}: Readonly<SessionHeaderBarProps>) {
  const isActionDisabled = !questionsReady || isCompleting || isVoiceBusy

  return (
    <Paper withBorder radius="md" p="sm">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Group gap="xs" wrap="wrap">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onPause}
            loading={statusAction === 'paused'}
            disabled={isActionDisabled}
            leftSection={
              <IconPlayerPause size={16} stroke={1.5} aria-hidden="true" />
            }
          >
            Tạm dừng
          </Button>

          <Button
            type="button"
            variant="light"
            color="brand"
            size="sm"
            onClick={onEarlyFinish}
            loading={statusAction === 'completed'}
            disabled={isActionDisabled}
            leftSection={
              <IconFlagCheck size={16} stroke={1.5} aria-hidden="true" />
            }
          >
            Kết thúc sớm
          </Button>

          <Button
            type="button"
            variant="light"
            color="danger"
            size="sm"
            onClick={onCancel}
            loading={statusAction === 'canceled'}
            disabled={isCompleting || isVoiceBusy}
            leftSection={
              <IconCircleX size={16} stroke={1.5} aria-hidden="true" />
            }
          >
            Hủy
          </Button>
        </Group>

        <Group gap="sm" align="center" wrap="nowrap">
          {connectionState === 'reconnecting' ? (
            <Badge color="warning" variant="light" size="sm">
              Đang kết nối lại...
            </Badge>
          ) : null}

          {connectionState === 'disconnected' ? (
            <Group gap={4} wrap="nowrap">
              <Badge color="danger" variant="light" size="sm">
                Mất kết nối trực tiếp
              </Badge>
              <ActionIcon
                variant="subtle"
                color="danger"
                size="sm"
                aria-label="Kết nối lại sự kiện phiên"
                onClick={onReconnect}
              >
                <IconRefresh size={14} stroke={1.5} aria-hidden="true" />
              </ActionIcon>
            </Group>
          ) : null}

          <CountdownTimer
            initialSeconds={remainingSeconds}
            active={isTimerActive}
            onChange={onRemainingChange}
            onExpire={onExpire}
          />
        </Group>
      </Group>
    </Paper>
  )
}
