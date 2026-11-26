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
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { BrandLogo } from '@/components/common/BrandLogo'
import { ColorSchemeToggle } from '@/components/layout/header/ColorSchemeToggle'
import interactions from '@/styles/interactions.module.css'
import surfaces from '@/styles/surfaces.module.css'
import landing from '../landing.module.css'

export function PublicHeader() {
  const [opened, { toggle, close }] = useDisclosure(false)

  return (
    <Box
      component="header"
      className={`${landing.publicHeader} ${surfaces.bodySurface} ${surfaces.borderedBottom}`}
    >
      <Container size="lg" h="100%">
        <Group h="100%" justify="space-between" wrap="nowrap">
          <Anchor
            component={Link}
            href="/"
            underline="never"
            className={interactions.brandLink}
            aria-label="Intervia — Trang chủ"
          >
            <BrandLogo variant="lockup" size="md" decorative />
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
        title={<BrandLogo variant="lockup" size="sm" />}
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
