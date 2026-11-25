'use client'

import Link from 'next/link'
import { Anchor, Box, Group, Text, ThemeIcon } from '@mantine/core'
import { IconMicrophone } from '@tabler/icons-react'
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
          aria-label="Interview Coach — Trang chủ"
        >
          <ThemeIcon color="brand" variant="light" size="md" radius="md">
            <IconMicrophone size={18} stroke={1.5} aria-hidden="true" />
          </ThemeIcon>
          <Text fw={700} size="lg">
            Interview Coach
          </Text>
        </Anchor>

        <ColorSchemeToggle />
      </Group>
    </Box>
  )
}
