'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useMantineColorScheme } from '@mantine/core'

export function MantineColorSchemeSync() {
  const { theme, resolvedTheme } = useTheme()
  const { setColorScheme } = useMantineColorScheme()

  useEffect(() => {
    if (theme === 'system') {
      setColorScheme('auto')
      return
    }

    if (resolvedTheme === 'dark' || resolvedTheme === 'light') {
      setColorScheme(resolvedTheme)
    }
  }, [theme, resolvedTheme, setColorScheme])

  return null
}
