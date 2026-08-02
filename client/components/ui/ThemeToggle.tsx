'use client'

import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const emptySubscribe = () => () => {}
const useIsMounted = () => useSyncExternalStore(emptySubscribe, () => true, () => false)

const THEMES = ['light', 'dark', 'system'] as const

const ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const

const LABELS = {
  light: 'Chế độ sáng',
  dark: 'Chế độ tối',
  system: 'Theo hệ thống',
} as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useIsMounted()

  const currentTheme = (theme as (typeof THEMES)[number]) ?? 'system'

  function cycleTheme() {
    const currentIndex = THEMES.indexOf(currentTheme)
    const nextIndex = (currentIndex + 1) % THEMES.length
    setTheme(THEMES[nextIndex])
  }

  const Icon = mounted ? ICONS[currentTheme] : Monitor
  const label = mounted ? LABELS[currentTheme] : 'Theo hệ thống'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      aria-label={`${label}. Nhấn để chuyển theme`}
      title={label}
    >
      <Icon className="size-4" />
    </Button>
  )
}
