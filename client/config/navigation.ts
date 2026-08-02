import {
  LayoutDashboard,
  Users,
  User,
  CalendarDays,
  FileText,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  match: string[]
}

export const adminNavigation: NavItem[] = [
  {
    href: '/admin-dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    match: ['/admin-dashboard'],
  },
  {
    href: '/users',
    label: 'Quản lý User',
    icon: Users,
    match: ['/users'],
  },
  {
    href: '/admin-profile',
    label: 'Hồ sơ',
    icon: User,
    match: ['/admin-profile'],
  },
]

export const candidateNavigation: NavItem[] = [
  {
    href: '/sessions',
    label: 'Phỏng vấn',
    icon: CalendarDays,
    match: ['/sessions'],
  },
  {
    href: '/jd-library',
    label: 'Tạo mới',
    icon: FileText,
    match: ['/jd-library', '/setup'],
  },
  {
    href: '/profile',
    label: 'Hồ sơ',
    icon: User,
    match: ['/profile'],
  },
]
