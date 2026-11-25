import type { ReactNode } from 'react'
import { Box, Container, Flex, Paper } from '@mantine/core'
import { AuthHeader } from '@/components/auth/AuthHeader'
import layout from '@/styles/layout.module.css'

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <Box className={layout.fullHeightShell}>
      <AuthHeader />

      <Flex
        component="main"
        flex={1}
        align="center"
        justify="center"
        p="md"
        pb="xl"
      >
        <Container size={440} w="100%" px={0}>
          <Paper withBorder shadow="sm" p="xl" radius="md">
            {children}
          </Paper>
        </Container>
      </Flex>
    </Box>
  )
}
