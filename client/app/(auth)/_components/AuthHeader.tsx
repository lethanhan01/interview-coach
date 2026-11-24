'use client'

import Link from 'next/link'
import { Anchor, Box, Group, Text, ThemeIcon } from '@mantine/core'
import { IconMicrophone } from '@tabler/icons-react'
import { ColorSchemeToggle } from '@/components/layout/ColorSchemeToggle'
import classes from '../AuthLayout.module.css'

export function AuthHeader() {
  return (
    <Box component="header" className={classes.header}>
      <Group justify="space-between" wrap="nowrap">
        <Anchor
          component={Link}
          href="/"
          underline="never"
          className={classes.brandLink}
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
