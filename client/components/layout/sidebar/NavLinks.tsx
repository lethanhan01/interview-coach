'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Group,
  NavLink,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import type { NavIconComponent } from '@/config/navigation'
import classes from './NavLinks.module.css'

export interface NavLinkItem {
  href: string
  label: string
  icon?: NavIconComponent
  match: string[]
}

export interface NavLinksProps {
  items: NavLinkItem[]
  orientation?: 'vertical' | 'horizontal'
  collapsed?: boolean
  onNavigate?: () => void
  ariaLabel?: string
  asNav?: boolean
}

export function isNavItemActive(
  pathname: string | null,
  match: string[]
): boolean {
  if (!pathname) return false
  return match.some((m) => pathname === m || pathname.startsWith(`${m}/`))
}

export default function NavLinks({
  items,
  orientation = 'horizontal',
  collapsed = false,
  onNavigate,
  ariaLabel = 'Điều hướng chính',
  asNav = true,
}: Readonly<NavLinksProps>) {
  const pathname = usePathname()

  if (orientation === 'vertical') {
    const content = items.map(({ href, label, icon: Icon, match }) => {
      const active = isNavItemActive(pathname, match)

      if (collapsed) {
        return (
          <Tooltip key={href} label={label} position="right" withArrow>
            <UnstyledButton
              component={Link}
              href={href}
              className={classes.railLink}
              mod={{ active }}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              onClick={onNavigate}
            >
              {Icon ? (
                <Icon size={20} stroke={1.5} aria-hidden="true" />
              ) : (
                <Text size="xs" fw={600}>
                  {label.slice(0, 2).toUpperCase()}
                </Text>
              )}
            </UnstyledButton>
          </Tooltip>
        )
      }

      return (
        <NavLink
          key={href}
          component={Link}
          href={href}
          label={label}
          leftSection={
            Icon ? (
              <Icon size={18} stroke={1.5} aria-hidden="true" />
            ) : undefined
          }
          active={active}
          color="brand"
          variant="light"
          className={classes.navLink}
          aria-current={active ? 'page' : undefined}
          onClick={onNavigate}
        />
      )
    })

    if (asNav) {
      return (
        <Stack component="nav" gap={4} aria-label={ariaLabel}>
          {content}
        </Stack>
      )
    }

    return <Stack gap={4}>{content}</Stack>
  }

  const horizontalItems = items.map(({ href, label, match }) => {
    const active = isNavItemActive(pathname, match)
    return (
      <UnstyledButton
        key={href}
        component={Link}
        href={href}
        className={classes.horizontalLink}
        mod={{ active }}
        aria-current={active ? 'page' : undefined}
        onClick={onNavigate}
      >
        {label}
      </UnstyledButton>
    )
  })

  if (asNav) {
    return (
      <Group component="nav" gap="xs" aria-label={ariaLabel}>
        {horizontalItems}
      </Group>
    )
  }

  return <Group gap="xs">{horizontalItems}</Group>
}
