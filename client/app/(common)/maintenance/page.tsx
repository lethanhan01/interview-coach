import { Wrench } from 'lucide-react'
import { ErrorPageTemplate } from '@/components/patterns/ErrorPageTemplate'

/**
 * /maintenance — Maintenance Mode Page
 *
 * Activated via NEXT_PUBLIC_MAINTENANCE_MODE=true.
 * Middleware (maintenance.guard.ts) redirects all non-bypassed routes here.
 *
 * Optional: Set NEXT_PUBLIC_MAINTENANCE_ETA to show estimated completion time.
 * Example: NEXT_PUBLIC_MAINTENANCE_ETA="14:00 ngày 07/09/2026"
 */
export default function MaintenancePage() {
  const eta = process.env.NEXT_PUBLIC_MAINTENANCE_ETA

  return (
    <ErrorPageTemplate
      icon={<Wrench className="size-16" />}
      iconVariant="warning"
      title="Hệ thống đang bảo trì"
      description="Chúng tôi đang thực hiện nâng cấp để mang lại trải nghiệm tốt hơn cho bạn. Hệ thống sẽ sớm hoạt động trở lại."
      actions={[]}
    >
      {eta && (
        <p className="text-ink-faint mt-3 text-xs">
          Dự kiến hoàn thành:{' '}
          <span className="text-ink-muted font-medium">{eta}</span>
        </p>
      )}
    </ErrorPageTemplate>
  )
}
