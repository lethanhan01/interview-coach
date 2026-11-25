'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  Anchor,
  Button,
  Code,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { BrandLogo } from '@/components/common/BrandLogo'
import interactions from '@/styles/interactions.module.css'
import type { SemanticColor } from '@/theme'
import common from '../common.module.css'

export type ErrorPageIconVariant = SemanticColor

export interface ErrorPageAction {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'outline' | 'ghost'
  disabled?: boolean
  icon?: ReactNode
}

export interface ErrorPageTemplateProps {
  icon: ReactNode
  iconVariant: ErrorPageIconVariant
  title: string
  description: string
  statusCode?: number
  errorDigest?: string
  actions?: ErrorPageAction[]
  children?: ReactNode
}

function getActionButtonProps(variant: ErrorPageAction['variant']) {
  if (variant === 'outline') {
    return { color: 'neutral' as const, variant: 'default' as const }
  }
  if (variant === 'ghost') {
    return { color: 'neutral' as const, variant: 'subtle' as const }
  }
  return { color: 'brand' as const, variant: 'filled' as const }
}

export function ErrorPageTemplate({
  icon,
  iconVariant,
  title,
  description,
  statusCode,
  errorDigest,
  actions = [],
  children,
}: Readonly<ErrorPageTemplateProps>) {
  return (
    <Container size="sm" className={common.errorContainer}>
      <Paper withBorder shadow="sm" p="xl" radius="lg" w="100%">
        <Stack align="center" gap="md">
          <Anchor
            component={Link}
            href="/"
            underline="never"
            className={interactions.brandLink}
            aria-label="Intervia — Trang chủ"
          >
            <BrandLogo variant="lockup" size="sm" decorative />
          </Anchor>

          <ThemeIcon color={iconVariant} variant="light" size={64} radius="xl">
            {icon}
          </ThemeIcon>

          {statusCode !== undefined ? (
            <Text className={common.errorStatusCode} c="dimmed">
              {statusCode}
            </Text>
          ) : null}

          <Title order={1} size="h2" ta="center">
            {title}
          </Title>

          <Text c="dimmed" size="sm" ta="center" maw={420}>
            {description}
          </Text>

          {errorDigest ? <Code>Mã lỗi: {errorDigest}</Code> : null}

          {actions.length > 0 ? (
            <Group justify="center" gap="sm" mt="xs">
              {actions.map((action, index) => {
                const resolvedVariant =
                  action.variant ?? (index === 0 ? 'primary' : 'outline')
                const buttonProps = getActionButtonProps(resolvedVariant)

                if (action.href && !action.disabled) {
                  return (
                    <Button
                      key={action.label}
                      component={Link}
                      href={action.href}
                      leftSection={action.icon}
                      {...buttonProps}
                    >
                      {action.label}
                    </Button>
                  )
                }

                return (
                  <Button
                    key={action.label}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    leftSection={action.icon}
                    {...buttonProps}
                  >
                    {action.label}
                  </Button>
                )
              })}
            </Group>
          ) : null}

          {children}
        </Stack>
      </Paper>
    </Container>
  )
}
