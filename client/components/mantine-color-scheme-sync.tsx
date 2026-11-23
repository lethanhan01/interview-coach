'use client'

import { useEffect } from 'react'
import { useComputedColorScheme } from '@mantine/core'

export function MantineColorSchemeSync() {
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  })

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      computedColorScheme === 'dark'
    )
  }, [computedColorScheme])

  return null
}
