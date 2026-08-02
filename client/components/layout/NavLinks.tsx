'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface NavLinkItem {
  href: string
  label: string
  match: string[]
}

export interface NavLinksProps {
  items: NavLinkItem[]
}

export default function NavLinks({ items }: NavLinksProps) {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1" aria-label="Main Navigation">
      {items.map(({ href, label, match }) => {
        const active = pathname 
          ? match.some((m) => pathname === m || pathname.startsWith(m + '/'))
          : false
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'focus-visible:ring-brand rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              active
                ? 'text-brand-subtle-fg bg-brand-subtle font-semibold'
                : 'text-ink-muted hover:text-brand-subtle-fg hover:bg-brand-subtle'
            )}
            aria-current={active ? 'page' : undefined}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
