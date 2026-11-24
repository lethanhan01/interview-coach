'use client'

import Link from 'next/link'
import {
  Alert,
  Button,
  Container,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
  VisuallyHidden,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCircleX,
  IconPlayerPause,
  IconPlayerPlay,
} from '@tabler/icons-react'
import FeedbackProgressPanel from './FeedbackProgressPanel'
import type { FeedbackProgress, SessionStatusAction } from '@/types'

export interface SessionStatusViewProps {
  state: 'loading' | 'error' | 'completing' | 'paused' | 'canceled'
  error?: string | null
  actionError?: string | null
  liveProgress?: FeedbackProgress | null
  isTimeoutCompleting?: boolean
  statusAction?: SessionStatusAction | null
  onResume?: () => void
  onCancel?: () => void
}

export default function SessionStatusView({
  state,
  error,
  actionError,
  liveProgress = null,
  isTimeoutCompleting = false,
  statusAction = null,
  onResume,
  onCancel,
}: Readonly<SessionStatusViewProps>) {
  if (state === 'loading') {
    return (
      <Container size="sm" py="xl">
        <Stack gap="md" aria-busy="true">
          <VisuallyHidden role="status">
            Đang tải phiên phỏng vấn...
          </VisuallyHidden>
          <Skeleton height={50} radius="md" />
          <Skeleton height={200} radius="md" />
          <Skeleton height={150} radius="md" />
        </Stack>
      </Container>
    )
  }

  if (state === 'error') {
    return (
      <Container size="sm" py="xl">
        <Paper withBorder radius="md" p="xl">
          <Stack align="center" gap="md" ta="center">
            <Title order={1} size="h3">
              Không thể tiếp tục phiên phỏng vấn
            </Title>
            <Alert
              color="danger"
              variant="light"
              role="alert"
              w="100%"
              icon={
                <IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />
              }
            >
              {error || 'Có lỗi xảy ra trong phiên phỏng vấn.'}
            </Alert>
            <Button
              component={Link}
              href="/sessions"
              transitionTypes={['nav-back']}
              variant="subtle"
              color="neutral"
              leftSection={
                <IconArrowLeft size={16} stroke={1.5} aria-hidden="true" />
              }
            >
              Quay về danh sách
            </Button>
          </Stack>
        </Paper>
      </Container>
    )
  }

  if (state === 'completing') {
    return (
      <Container size="sm" py="xl">
        <FeedbackProgressPanel
          progress={liveProgress}
          isTimeoutCompleting={isTimeoutCompleting}
          backHref="/sessions"
        />
      </Container>
    )
  }

  if (state === 'paused') {
    return (
      <Container size="sm" py="xl">
        <Paper withBorder radius="md" p="xl">
          <Stack align="center" gap="md" ta="center">
            <ThemeIcon size={56} radius="xl" color="brand" variant="light">
              <IconPlayerPause size={28} stroke={1.5} aria-hidden="true" />
            </ThemeIcon>
            <Title order={1} size="h3">
              Phiên phỏng vấn đang tạm dừng
            </Title>
            <Text size="sm" c="dimmed">
              Bạn có thể tiếp tục hoặc hủy phiên này.
            </Text>
            {actionError ? (
              <Alert
                color="danger"
                variant="light"
                role="alert"
                w="100%"
                icon={
                  <IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />
                }
              >
                {actionError}
              </Alert>
            ) : null}
            <Group justify="center" gap="sm">
              <Button
                type="button"
                color="brand"
                onClick={onResume}
                loading={statusAction === 'active'}
                leftSection={
                  <IconPlayerPlay size={16} stroke={1.5} aria-hidden="true" />
                }
              >
                Tiếp tục
              </Button>
              <Button
                type="button"
                color="danger"
                variant="light"
                onClick={onCancel}
                loading={statusAction === 'canceled'}
                leftSection={
                  <IconCircleX size={16} stroke={1.5} aria-hidden="true" />
                }
              >
                Hủy phiên
              </Button>
              <Button
                component={Link}
                href="/sessions"
                transitionTypes={['nav-back']}
                variant="default"
                leftSection={
                  <IconArrowLeft size={16} stroke={1.5} aria-hidden="true" />
                }
              >
                Danh sách
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Container>
    )
  }

  return (
    <Container size="sm" py="xl">
      <Paper withBorder radius="md" p="xl">
        <Stack align="center" gap="md" ta="center">
          <ThemeIcon size={56} radius="xl" color="danger" variant="light">
            <IconCircleX size={28} stroke={1.5} aria-hidden="true" />
          </ThemeIcon>
          <Title order={1} size="h3">
            Phiên phỏng vấn đã hủy
          </Title>
          <Text size="sm" c="dimmed">
            Phiên này sẽ không tạo báo cáo đánh giá.
          </Text>
          <Button
            component={Link}
            href="/sessions"
            transitionTypes={['nav-back']}
            variant="default"
            leftSection={
              <IconArrowLeft size={16} stroke={1.5} aria-hidden="true" />
            }
          >
            Quay về danh sách
          </Button>
        </Stack>
      </Paper>
    </Container>
  )
}
