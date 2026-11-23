'use client'

import {
  ActionIcon,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'
import classes from './ColorSchemeToggle.module.css'

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme()
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  })

  const handleToggle = () => {
    setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')
  }

  return (
    <ActionIcon
      onClick={handleToggle}
      variant="default"
      size="lg"
      radius="md"
      aria-label="Chuyển đổi chế độ sáng tối"
    >
      <IconSun
        className={`${classes.icon} ${classes.light}`}
        stroke={1.5}
        aria-hidden="true"
      />
      <IconMoon
        className={`${classes.icon} ${classes.dark}`}
        stroke={1.5}
        aria-hidden="true"
      />
    </ActionIcon>
  )
}
