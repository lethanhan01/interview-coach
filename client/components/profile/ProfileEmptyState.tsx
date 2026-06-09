import { ReactNode } from 'react'

interface ProfileEmptyStateProps {
  message: ReactNode
  className?: string
}

export default function ProfileEmptyState({ message, className = '' }: ProfileEmptyStateProps) {
  return <p className={["text-sm italic text-ink-muted/60", className].join(' ')}>{message}</p>
}