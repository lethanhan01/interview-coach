'use client'

import Link from 'next/link'
import { Anchor, Box, Group } from '@mantine/core'
import { BrandLogo } from '@/components/common/BrandLogo'
import { ColorSchemeToggle } from '@/components/layout/header/ColorSchemeToggle'
import interactions from '@/styles/interactions.module.css'

export function AuthHeader() {
  return (
    <Box component="header" w="100%" px="lg" py="md">
      <Group justify="space-between" wrap="nowrap">
        <Anchor
          component={Link}
          href="/"
          underline="never"
          className={interactions.brandLink}
          aria-label="Intervia — Trang chủ"
        >
          <BrandLogo variant="lockup" size="md" decorative />
        </Anchor>

        <ColorSchemeToggle />
      </Group>
    </Box>
  )
}
