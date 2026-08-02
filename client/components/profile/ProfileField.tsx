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
  const displayValue =
    value === null || value === undefined || value === '' ? emptyValue : value

  return (
    <div className={className}>
      <dt className="text-ink-muted text-xs font-medium">{label}</dt>
      <dd className="text-ink mt-0.5 text-sm">{displayValue}</dd>
    </div>
  )
}
