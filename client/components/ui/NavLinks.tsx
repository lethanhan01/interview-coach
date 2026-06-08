'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/sessions', label: 'Phỏng vấn' },
  { href: '/setup', label: 'Tạo mới' },
  { href: '/profile', label: 'Hồ sơ' },
]

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1">
      {NAV_LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={[
              'px-3 py-1.5 text-sm rounded-lg transition-colors',
              active
                ? 'font-semibold text-brand bg-brand-50'
                : 'text-ink-muted hover:text-brand hover:bg-brand-50',
            ].join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
