import React from 'react'
import { Check, CheckCheck, AlertTriangle, XCircle, HelpCircle } from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { RecommendationStatus } from '@/lib/types'

export interface RecommendationBadgeProps {
  status?: RecommendationStatus | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface StatusConfig {
  variant: NonNullable<BadgeProps['variant']>
  label: string
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
}

const STATUS_CONFIG: Record<RecommendationStatus, StatusConfig> = {
  strongly_recommended: {
    variant: 'success',
    label: 'Xuất Sắc - Đạt Chuẩn Cao',
    Icon: CheckCheck,
  },
  recommended: {
    variant: 'brand',
    label: 'Đạt Yêu Cầu Tuyển Dụng',
    Icon: Check,
  },
  borderline: {
    variant: 'warning',
    label: 'Cân Nhắc - Cần Đánh Giá Thêm',
    Icon: AlertTriangle,
  },
  not_recommended: {
    variant: 'danger',
    label: 'Chưa Đạt Chuẩn Kỳ Vọng',
    Icon: XCircle,
  },
}

const SIZE_VARIANTS = {
  sm: {
    badgeClass: 'px-2 py-0.5 text-xs gap-1',
    iconClass: 'size-3',
  },
  md: {
    badgeClass: 'px-2.5 py-1 text-xs gap-1.5 font-medium',
    iconClass: 'size-3.5',
  },
  lg: {
    badgeClass: 'px-3.5 py-1.5 text-sm gap-2 font-semibold',
    iconClass: 'size-4',
  },
} as const

export function RecommendationBadge({
  status,
  size = 'md',
  className,
}: RecommendationBadgeProps) {
  if (!status || !STATUS_CONFIG[status]) {
    return (
      <Badge
        variant="secondary"
        role="status"
        aria-label="Chưa xác định khuyến nghị"
        className={cn(
          'inline-flex items-center',
          SIZE_VARIANTS[size].badgeClass,
          className
        )}
      >
        <HelpCircle
          className={SIZE_VARIANTS[size].iconClass}
          aria-hidden="true"
        />
        <span>Chưa xác định</span>
      </Badge>
    )
  }

  const config = STATUS_CONFIG[status]
  const { Icon } = config
  const sizeConfig = SIZE_VARIANTS[size]

  return (
    <Badge
      variant={config.variant}
      role="status"
      aria-label={config.label}
      className={cn(
        'inline-flex items-center shadow-xs select-none',
        sizeConfig.badgeClass,
        className
      )}
    >
      <Icon className={cn('shrink-0', sizeConfig.iconClass)} aria-hidden="true" />
      <span>{config.label}</span>
    </Badge>
  )
}
