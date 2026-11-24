'use client'

import { Badge } from '@mantine/core'
import {
  IconAlertTriangle,
  IconCheck,
  IconChecks,
  IconCircleX,
  IconHelpCircle,
} from '@tabler/icons-react'
import type { RecommendationStatus } from '@/types'

export interface RecommendationBadgeProps {
  status?: RecommendationStatus | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface StatusConfig {
  color: 'success' | 'brand' | 'warning' | 'danger' | 'neutral'
  label: string
  Icon: typeof IconCheck
  ariaLabel: string
}

const STATUS_CONFIG: Record<RecommendationStatus, StatusConfig> = {
  strongly_recommended: {
    color: 'success',
    label: 'Xuất Sắc - Đạt Chuẩn Cao',
    Icon: IconChecks,
    ariaLabel: 'Xuất Sắc - Đạt Chuẩn Cao',
  },
  recommended: {
    color: 'brand',
    label: 'Đạt Yêu Cầu Tuyển Dụng',
    Icon: IconCheck,
    ariaLabel: 'Đạt Yêu Cầu Tuyển Dụng',
  },
  borderline: {
    color: 'warning',
    label: 'Cân Nhắc - Cần Đánh Giá Thêm',
    Icon: IconAlertTriangle,
    ariaLabel: 'Cân Nhắc - Cần Đánh Giá Thêm',
  },
  not_recommended: {
    color: 'danger',
    label: 'Chưa Đạt Chuẩn Kỳ Vọng',
    Icon: IconCircleX,
    ariaLabel: 'Chưa Đạt Chuẩn Kỳ Vọng',
  },
}

const FALLBACK_CONFIG: StatusConfig = {
  color: 'neutral',
  label: 'Chưa xác định',
  Icon: IconHelpCircle,
  ariaLabel: 'Chưa xác định khuyến nghị',
}

const ICON_SIZE_MAP = {
  sm: 12,
  md: 14,
  lg: 16,
} as const

export function RecommendationBadge({
  status,
  size = 'md',
  className,
}: Readonly<RecommendationBadgeProps>) {
  const config = (status && STATUS_CONFIG[status]) || FALLBACK_CONFIG
  const { Icon } = config
  const iconSize = ICON_SIZE_MAP[size] ?? 14

  return (
    <Badge
      variant="light"
      color={config.color}
      size={size}
      role="status"
      aria-label={config.ariaLabel}
      leftSection={<Icon size={iconSize} stroke={1.5} aria-hidden="true" />}
      className={className}
    >
      {config.label}
    </Badge>
  )
}

export default RecommendationBadge
