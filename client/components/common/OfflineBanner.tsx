'use client'

import {
  Box,
  Button,
  Overlay,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { useNetwork } from '@mantine/hooks'
import { IconRefresh, IconWifiOff } from '@tabler/icons-react'
import common from './common.module.css'

export interface OfflineBannerProps {
  onRetry?: () => void
}

export function OfflineBanner({ onRetry }: Readonly<OfflineBannerProps>) {
  const network = useNetwork()

  if (network.online) return null

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
      return
    }
    window.location.reload()
  }

  return (
    <Box className={common.offlineOverlay} role="alert" aria-live="assertive">
      <Overlay blur={4} backgroundOpacity={0.75} zIndex={1} />
      <Paper
        withBorder
        shadow="md"
        p="xl"
        radius="lg"
        className={common.offlineCard}
      >
        <Stack align="center" gap="md">
          <ThemeIcon color="warning" variant="light" size={56} radius="md">
            <IconWifiOff size={28} stroke={1.5} aria-hidden="true" />
          </ThemeIcon>

          <Stack align="center" gap="xs">
            <Title order={2} size="h3" ta="center">
              Mất kết nối mạng
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Vui lòng kiểm tra kết nối internet. Trang sẽ tự động khôi phục khi
              có mạng trở lại.
            </Text>
          </Stack>

          <Button
            color="brand"
            leftSection={
              <IconRefresh size={16} stroke={1.5} aria-hidden="true" />
            }
            onClick={handleRetry}
          >
            Thử lại
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
