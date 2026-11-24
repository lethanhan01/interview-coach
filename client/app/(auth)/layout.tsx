import type { ReactNode } from 'react'
import { Box, Container, Paper } from '@mantine/core'
import { AuthHeader } from '@/components/auth/AuthHeader'
import classes from '@/components/auth/AuthLayout.module.css'

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <Box className={classes.wrapper}>
      <AuthHeader />

      <Box component="main" className={classes.main}>
        <Container size={440} w="100%" px={0}>
          <Paper withBorder shadow="sm" p="xl" radius="md">
            {children}
          </Paper>
        </Container>
      </Box>
    </Box>
  )
}
