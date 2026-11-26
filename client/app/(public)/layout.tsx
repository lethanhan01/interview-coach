import type { ReactNode } from 'react'
import { Box } from '@mantine/core'
import { PublicFooter } from '@/components/landing/chrome/PublicFooter'
import { PublicHeader } from '@/components/landing/chrome/PublicHeader'
import layout from '@/styles/layout.module.css'

export default function PublicLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <Box className={layout.fullHeightShell}>
      <PublicHeader />
      <Box component="main" flex={1}>
        {children}
      </Box>
      <PublicFooter />
    </Box>
  )
}
