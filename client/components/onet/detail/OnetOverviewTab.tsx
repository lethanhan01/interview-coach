'use client'

import {
  ActionIcon,
  Alert,
  CopyButton,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'
import { IconCheck, IconCopy, IconInfoCircle } from '@tabler/icons-react'
import type { OnetDetailSubTab, OnetOccupationDetail } from '@/types'
import { OnetOverviewStats } from './OnetOverviewStats'

export interface OnetOverviewTabProps {
  detail: OnetOccupationDetail
  onSelectDetailTab: (tab: OnetDetailSubTab) => void
}

export function OnetOverviewTab({
  detail,
  onSelectDetailTab,
}: Readonly<OnetOverviewTabProps>) {
  return (
    <Stack gap="sm">
      {/* 4 Interactive KPI Cards + Job Zone Visual Stepper */}
      <OnetOverviewStats
        detail={detail}
        onSelectDetailTab={onSelectDetailTab}
      />

      {/* Role Description Card */}
      <Paper withBorder p="sm" radius="md">
        <Stack gap="xs">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Title order={3} size="h6">
              Mô tả Vai trò Nghề nghiệp
            </Title>
            <CopyButton value={detail.description} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip
                  label={copied ? 'Đã sao chép' : 'Sao chép mô tả vai trò'}
                  withArrow
                >
                  <ActionIcon
                    color={copied ? 'success' : 'neutral'}
                    variant="subtle"
                    size="sm"
                    onClick={copy}
                    aria-label="Sao chép mô tả vai trò nghề nghiệp"
                  >
                    {copied ? (
                      <IconCheck size={16} stroke={1.5} />
                    ) : (
                      <IconCopy size={16} stroke={1.5} />
                    )}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>

          <Text size="sm" lh="relaxed">
            {detail.description}
          </Text>
        </Stack>
      </Paper>

      {/* Integration Note Banner */}
      <Alert
        color="brand"
        variant="light"
        icon={<IconInfoCircle size={18} />}
        title="Chuẩn hóa Đánh giá Phỏng vấn AI"
      >
        <Text size="xs" lh="relaxed">
          Dữ liệu O*NET được AI Interview Coach đối chiếu để phân tích JD thực
          tế, tự động sinh ngân hàng câu hỏi tình huống phù hợp với cấp độ Job
          Zone {detail.jobZone.zone}, và đánh giá năng lực ứng viên theo các kỹ
          năng SFIA đã ánh xạ.
        </Text>
      </Alert>
    </Stack>
  )
}
