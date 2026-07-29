'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const NAV_LINKS = [
  { href: '/sessions', label: 'Phỏng vấn', match: ['/sessions'] },
  { href: '/jd-library', label: 'Tạo mới', match: ['/jd-library', '/setup'] },
  { href: '/profile', label: 'Hồ sơ', match: ['/profile'] },
]

export default function NavLinks() {
  const pathname = usePathname()
  const { role } = useAuth()
  const links = role === 'admin' ? [...NAV_LINKS, { href: '/admin/users', label: 'Quản trị', match: ['/admin'] }] : NAV_LINKS

  return (
    <div className="flex items-center gap-1">
      {links.map(({ href, label, match }) => {
        const active = match.some((m) => pathname === m || pathname.startsWith(m + '/'))
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
