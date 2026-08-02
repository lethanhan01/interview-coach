import { ReactNode } from 'react'

interface ProfileEmptyStateProps {
  message: ReactNode
  className?: string
}

export default function ProfileEmptyState({
  message,
  className = '',
}: ProfileEmptyStateProps) {
  return (
    <p className={['text-ink-muted/60 text-sm italic', className].join(' ')}>
      {message}
    </p>
  )
}
