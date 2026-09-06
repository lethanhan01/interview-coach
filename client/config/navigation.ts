import {
  LayoutDashboard,
  Users,
  User,
  CalendarDays,
  FileText,
  ScrollText,
  BookOpen,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  match: string[]
}

export const adminNavigation: NavItem[] = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    match: ['/admin/dashboard', '/admin-dashboard'],
  },
  {
    href: '/admin/onet',
    label: 'O*NET Browser',
    icon: BookOpen,
    match: ['/admin/onet'],
  },
  {
    href: '/admin/users',
    label: 'Quản lý User',
    icon: Users,
    match: ['/admin/users', '/users'],
  },
  {
    href: '/admin/profile',
    label: 'Hồ sơ',
    icon: User,
    match: ['/admin/profile', '/admin-profile'],
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
    href: '/resume',
    label: 'CV / Resume',
    icon: ScrollText,
    match: ['/resume'],
  },
  {
    href: '/profile',
    label: 'Tài khoản',
    icon: User,
    match: ['/profile'],
  },
]
