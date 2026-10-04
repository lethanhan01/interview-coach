import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/patterns/LayoutPatterns'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ErrorPageIconVariant = 'brand' | 'danger' | 'warning' | 'muted'

export interface ErrorPageAction {
  label: string
  /** If provided, renders as a <Link>. Mutually exclusive with onClick. */
  href?: string
  /** If provided, renders as a <Button onClick>. Mutually exclusive with href. */
  onClick?: () => void
  variant?: 'primary' | 'outline' | 'ghost'
  disabled?: boolean
  icon?: React.ReactNode
}

export interface ErrorPageTemplateProps {
  /** Lucide-react icon element to display inside the icon wrapper. */
  icon: React.ReactNode
  /** Controls the color scheme of the icon wrapper. */
  iconVariant: ErrorPageIconVariant
  /** Main heading — rendered as <h1>. */
  title: string
  /** Supporting description text. */
  description: string
  /** Optional HTTP status code displayed above the title. */
  statusCode?: number
  /** Optional Next.js error digest shown as monospace error code. */
  errorDigest?: string
  /** List of CTA buttons. Each action renders as Link (href) or Button (onClick). */
  actions?: ErrorPageAction[]
  /** Optional slot for additional content below actions (e.g. countdown timer). */
  children?: React.ReactNode
  className?: string
}

// ─── Icon Variant Lookup Table ─────────────────────────────────────────────────
// Color-only lookup — no background or border, icon renders directly.
const iconColorMap: Record<ErrorPageIconVariant, string> = {
  brand:   'text-brand',
  danger:  'text-danger',
  warning: 'text-warning',
  muted:   'text-ink-muted',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ErrorPageTemplate({
  icon,
  iconVariant,
  title,
  description,
  statusCode,
  errorDigest,
  actions = [],
  children,
  className,
}: ErrorPageTemplateProps) {
  return (
    <PageContainer
      maxWidth="sm"
      className={cn('flex min-h-[70vh] items-center justify-center py-12', className)}
    >
      <Card className="flex w-full flex-col items-center p-8 text-center shadow-elevation-2">
        {/* Icon — rendered directly, no wrapper box */}
        <div className={iconColorMap[iconVariant]}>
          {icon}
        </div>

        {/* Status code */}
        {statusCode !== undefined && (
          <p className="text-ink-muted mt-3 font-mono text-4xl font-bold tracking-tight">
            {statusCode}
          </p>
        )}

        {/* Title */}
        <h1 className="text-ink mt-4 text-2xl font-bold">{title}</h1>

        {/* Description */}
        <p className="text-ink-muted mt-2 max-w-xs text-sm leading-relaxed">
          {description}
        </p>

        {/* Error digest (Next.js error.digest) */}
        {errorDigest && (
          <p className="text-ink-faint mt-2 font-mono text-xs">
            Mã lỗi: {errorDigest}
          </p>
        )}

        {/* CTA Actions */}
        {actions.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {actions.map((action, idx) => {
              const btnVariant = action.variant ?? (idx === 0 ? 'primary' : 'outline')

              if (action.href) {
                return (
                  <Button
                    key={idx}
                    asChild
                    variant={btnVariant}
                    size="md"
                    disabled={action.disabled}
                  >
                    <Link href={action.href} className="gap-2">
                      {action.icon}
                      <span>{action.label}</span>
                    </Link>
                  </Button>
                )
              }

              return (
                <Button
                  key={idx}
                  variant={btnVariant}
                  size="md"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="gap-2"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </Button>
              )
            })}
          </div>
        )}

        {/* Optional children slot */}
        {children}
      </Card>
    </PageContainer>
  )
}
