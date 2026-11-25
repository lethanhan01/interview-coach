'use client'

import Link from 'next/link'
import { Anchor, Box, Container, Group, Stack, Text } from '@mantine/core'
import { BrandLogo } from '@/components/common/BrandLogo'
import interactions from '@/styles/interactions.module.css'
import surfaces from '@/styles/surfaces.module.css'

export function PublicFooter() {
  return (
    <Box
      component="footer"
      py="lg"
      className={`${surfaces.borderedTop} ${surfaces.bodySurface}`}
    >
      <Container size="lg">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Stack gap={4}>
            <Anchor
              component={Link}
              href="/"
              underline="never"
              className={interactions.brandLink}
              aria-label="Intervia — Trang chủ"
            >
              <BrandLogo variant="lockup" size="sm" decorative />
            </Anchor>
            <Text size="xs" c="dimmed">
              Luyện phỏng vấn AI chuẩn STAR &amp; SFIA 9
            </Text>
          </Stack>

          <Group gap="md" wrap="wrap">
            <Anchor component={Link} href="/login" size="sm" c="dimmed">
              Đăng nhập
            </Anchor>
            <Anchor component={Link} href="/register" size="sm" c="dimmed">
              Đăng ký
            </Anchor>
            <Text size="sm" c="dimmed">
              &copy; 2026 Intervia. All rights reserved.
            </Text>
          </Group>
        </Group>
      </Container>
    </Box>
  )
}
