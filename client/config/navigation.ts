import type { ComponentType } from 'react'
import {
  IconBook,
  IconFilePlus,
  IconFileText,
  IconHierarchy,
  IconLayoutDashboard,
  IconMessages,
  IconUser,
  IconUsers,
} from '@tabler/icons-react'

export type NavIconComponent = ComponentType<{
  size?: number | string
  stroke?: number
}>

export interface NavItem {
  href: string
  label: string
  icon: NavIconComponent
  match: string[]
}

export const adminNavigation: NavItem[] = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: IconLayoutDashboard,
    match: ['/admin/dashboard', '/admin-dashboard'],
  },
  {
    href: '/admin/onet',
    label: 'O*NET Browser',
    icon: IconBook,
    match: ['/admin/onet'],
  },
  {
    href: '/admin/sfia',
    label: 'SFIA Framework',
    icon: IconHierarchy,
    match: ['/admin/sfia'],
  },
  {
    href: '/admin/users',
    label: 'Quản lý User',
    icon: IconUsers,
    match: ['/admin/users', '/users'],
  },
  {
    href: '/admin/profile',
    label: 'Hồ sơ',
    icon: IconUser,
    match: ['/admin/profile', '/admin-profile'],
  },
]

export const candidateNavigation: NavItem[] = [
  {
    href: '/sessions',
    label: 'Phỏng vấn',
    icon: IconMessages,
    match: ['/sessions'],
  },
  {
    href: '/jd-library',
    label: 'Tạo mới',
    icon: IconFilePlus,
    match: ['/jd-library', '/setup'],
  },
  {
    href: '/resume',
    label: 'CV / Resume',
    icon: IconFileText,
    match: ['/resume'],
  },
  {
    href: '/profile',
    label: 'Tài khoản',
    icon: IconUser,
    match: ['/profile'],
  },
]
