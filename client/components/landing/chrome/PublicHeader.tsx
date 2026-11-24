'use client'

import Link from 'next/link'
import {
  Anchor,
  Box,
  Burger,
  Button,
  Container,
  Drawer,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconMicrophone } from '@tabler/icons-react'
import { ColorSchemeToggle } from '@/components/layout/header/ColorSchemeToggle'
import interactions from '@/styles/interactions.module.css'
import classes from './PublicHeader.module.css'

export function PublicHeader() {
  const [opened, { toggle, close }] = useDisclosure(false)

  return (
    <Box component="header" className={classes.header}>
      <Container size="lg" h="100%">
        <Group h="100%" justify="space-between" wrap="nowrap">
          <Anchor
            component={Link}
            href="/"
            underline="never"
            className={`${classes.brandLink} ${interactions.focusRing}`}
            aria-label="Interview Coach — Trang chủ"
          >
            <ThemeIcon color="brand" variant="light" size="md" radius="md">
              <IconMicrophone size={18} stroke={1.5} aria-hidden="true" />
            </ThemeIcon>
            <Text fw={700} size="lg">
              Interview Coach
            </Text>
          </Anchor>

          <Group
            component="nav"
            aria-label="Điều hướng công khai"
            gap="xs"
            visibleFrom="sm"
          >
            <ColorSchemeToggle />
            <Button component={Link} href="/login" variant="default">
              Đăng nhập
            </Button>
            <Button component={Link} href="/register" color="brand">
              Bắt đầu miễn phí
            </Button>
          </Group>

          <Group gap="xs" hiddenFrom="sm">
            <ColorSchemeToggle />
            <Burger
              opened={opened}
              onClick={toggle}
              size="sm"
              aria-label="Mở menu điều hướng"
            />
          </Group>
        </Group>
      </Container>

      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        size="xs"
        title="Interview Coach"
      >
        <Stack gap="sm" mt="sm">
          <Button
            component={Link}
            href="/register"
            color="brand"
            fullWidth
            onClick={close}
          >
            Bắt đầu miễn phí
          </Button>
          <Button
            component={Link}
            href="/login"
            variant="default"
            fullWidth
            onClick={close}
          >
            Đăng nhập
          </Button>
        </Stack>
      </Drawer>
    </Box>
  )
}
