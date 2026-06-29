import { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

interface ProfileSectionProps {
  title: string
  action?: ReactNode
  children: ReactNode
}

export default function ProfileSection({ title, action, children }: ProfileSectionProps) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  )
}