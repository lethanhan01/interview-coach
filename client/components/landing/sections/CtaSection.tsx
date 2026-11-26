'use client'

import Link from 'next/link'
import {
  Box,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import surfaces from '@/styles/surfaces.module.css'
import landing from '../landing.module.css'

export function CtaSection() {
  return (
    <Box component="section" className={landing.ctaSection}>
      <Container size="lg">
        <Paper
          withBorder
          radius="lg"
          className={`${landing.ctaBanner} ${surfaces.subtleSurface}`}
        >
          <Stack align="center" gap="md">
            <Title order={2} ta="center">
              Sẵn sàng luyện tập cùng Intervia?
            </Title>
            <Text c="dimmed" ta="center" maw={480}>
              Tạo tài khoản miễn phí và bắt đầu phiên phỏng vấn đầu tiên ngay
              hôm nay.
            </Text>
            <Group justify="center" gap="sm" mt="xs">
              <Button
                component={Link}
                href="/register"
                size="md"
                color="brand"
                rightSection={
                  <IconArrowRight size={16} stroke={1.5} aria-hidden="true" />
                }
              >
                Đăng ký miễn phí
              </Button>
              <Button
                component={Link}
                href="/login"
                size="md"
                variant="default"
              >
                Đã có tài khoản
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
