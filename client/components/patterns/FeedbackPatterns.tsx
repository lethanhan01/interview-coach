import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AlertCircle, FileX } from 'lucide-react'

export interface LoadingStateProps {
  text?: string
  className?: string
  minHeight?: string
}

export function LoadingState({
  text = 'Đang tải dữ liệu...',
  className,
  minHeight = 'min-h-[200px]',
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'text-ink-muted flex flex-col items-center justify-center gap-4 p-8',
        minHeight,
        className
      )}
    >
      <LoadingSpinner className="text-brand h-8 w-8" />
      <p className="text-sm">{text}</p>
    </div>
  )
}

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  minHeight?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  minHeight = 'min-h-[250px]',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-8 text-center',
        minHeight,
        className
      )}
    >
      <div className="text-ink-muted/50 mb-2">
        {icon || <FileX className="h-12 w-12" />}
      </div>
      <h3 className="text-ink text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-ink-muted max-w-sm text-sm">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  )
}

export interface ErrorStateProps {
  title?: string
  description?: string
  error?: Error | null
  onRetry?: () => void
  retryLabel?: string
  className?: string
  minHeight?: string
}

export function ErrorState({
  title = 'Đã có lỗi xảy ra',
  description = 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
  error,
  onRetry,
  retryLabel = 'Thử lại',
  className,
  minHeight = 'min-h-[250px]',
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'border-danger/20 bg-danger/5 flex flex-col items-center justify-center gap-3 rounded-lg border p-8 text-center',
        minHeight,
        className
      )}
    >
      <div className="text-danger mb-2">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h3 className="text-danger text-lg font-semibold">{title}</h3>
      <p className="text-danger/80 max-w-sm text-sm">
        {error?.message || description}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="border-danger/20 text-danger hover:bg-danger/10 mt-4"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

export interface AsyncBoundaryProps {
  isLoading: boolean
  isError: boolean
  isEmpty?: boolean
  error?: Error | null
  onRetry?: () => void
  loadingText?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: ReactNode
  emptyAction?: { label: string; onClick: () => void }
  children: ReactNode
}

export function AsyncBoundary({
  isLoading,
  isError,
  isEmpty = false,
  error,
  onRetry,
  loadingText,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription,
  emptyIcon,
  emptyAction,
  children,
}: AsyncBoundaryProps) {
  if (isLoading) {
    return <LoadingState text={loadingText} />
  }

  if (isError) {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
        action={emptyAction}
      />
    )
  }

  return <>{children}</>
}
