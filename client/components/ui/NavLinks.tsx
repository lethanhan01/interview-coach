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
    <div className="flex items-center gap-6">
      {NAV_LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`text-sm transition-colors ${
              active ? 'font-semibold text-gray-900' : 'text-gray-500 hover:text-gray-900'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
