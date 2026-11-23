import type { ReactNode } from 'react'
import { Box } from '@mantine/core'
import { PublicFooter } from '@/components/landing/PublicFooter'
import { PublicHeader } from '@/components/landing/PublicHeader'
import classes from './PublicLayout.module.css'

export default function PublicLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <Box className={classes.shell}>
      <PublicHeader />
      <Box component="main" className={classes.main}>
        {children}
      </Box>
      <PublicFooter />
    </Box>
  )
}
