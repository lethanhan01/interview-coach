import type { ReactNode } from 'react'
import {
  Box,
  Container,
  Divider,
  Flex,
  Group,
  Paper,
  Stack,
} from '@mantine/core'
import { AuthHeader } from '@/components/auth/AuthHeader'
import { BrandLogo } from '@/components/common/BrandLogo'
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
            <Stack gap="lg">
              <Group justify="center">
                <BrandLogo variant="lockup" size="md" />
              </Group>
              <Divider />
              {children}
            </Stack>
          </Paper>
        </Container>
      </Flex>
    </Box>
  )
}
