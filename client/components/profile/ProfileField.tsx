import { ReactNode } from 'react'

interface ProfileFieldProps {
  label: string
  value?: ReactNode
  emptyValue?: ReactNode
  className?: string
}

export default function ProfileField({
  label,
  value,
  emptyValue = '—',
  className = '',
}: ProfileFieldProps) {
  const displayValue = value === null || value === undefined || value === '' ? emptyValue : value

  return (
    <div className={className}>
      <dt className="text-xs font-medium text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{displayValue}</dd>
    </div>
  )
}