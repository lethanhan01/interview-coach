import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface PageContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const maxWidthMap = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  full: 'max-w-full',
}

export function PageContainer({
  children,
  className,
  maxWidth = 'xl',
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 py-6 md:px-6 md:py-8',
        maxWidthMap[maxWidth],
        className
      )}
    >
      {children}
    </div>
  )
}

export interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between',
        className
      )}
    >
      <div className="flex flex-col gap-1">
        {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
        <h1 className="text-ink text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export interface PageSectionProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function PageSection({
  title,
  description,
  children,
  className,
  contentClassName,
}: PageSectionProps) {
  return (
    <section className={cn('mb-10 last:mb-0', className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className="text-ink text-xl font-semibold">{title}</h2>}
          {description && (
            <p className="text-ink-muted text-sm">{description}</p>
          )}
        </div>
      )}
      <div className={cn(contentClassName)}>{children}</div>
    </section>
  )
}

export interface ResponsiveStackProps {
  children: ReactNode
  className?: string
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  gap?: 'sm' | 'md' | 'lg'
}

const gapMap = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
}

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
}

const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
}

export function ResponsiveStack({
  children,
  className,
  align = 'stretch',
  justify = 'start',
  gap = 'md',
}: ResponsiveStackProps) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row',
        gapMap[gap],
        alignMap[align],
        justifyMap[justify],
        className
      )}
    >
      {children}
    </div>
  )
}
