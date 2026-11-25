'use client'

import Link from 'next/link'
import { Anchor, Box, Container, Group, Text } from '@mantine/core'
import surfaces from '@/styles/surfaces.module.css'

export function PublicFooter() {
  return (
    <Box
      component="footer"
      py="lg"
      className={`${surfaces.borderedTop} ${surfaces.bodySurface}`}
    >
      <Container size="lg">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Text size="sm" c="dimmed">
            &copy; 2026 Interview Coach. All rights reserved.
          </Text>
          <Group gap="md">
            <Anchor component={Link} href="/login" size="sm" c="dimmed">
              Đăng nhập
            </Anchor>
            <Anchor component={Link} href="/register" size="sm" c="dimmed">
              Đăng ký
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Box>
  )
}
