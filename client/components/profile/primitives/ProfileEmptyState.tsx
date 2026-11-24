import type { ReactNode } from 'react'
import { Text } from '@mantine/core'

export interface ProfileEmptyStateProps {
  message: ReactNode
  className?: string
}

export default function ProfileEmptyState({
  message,
  className,
}: Readonly<ProfileEmptyStateProps>) {
  return (
    <Text size="sm" c="dimmed" fs="italic" className={className}>
      {message}
    </Text>
  )
}
