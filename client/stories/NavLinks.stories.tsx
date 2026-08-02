import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import NavLinks from '@/components/layout/NavLinks'

const meta: Meta<typeof NavLinks> = {
  title: 'Layout/NavLinks',
  component: NavLinks,
  tags: ['autodocs'],
  args: {
    items: [
      { href: '/sessions', label: 'Phỏng vấn', match: ['/sessions'] },
      { href: '/jd-library', label: 'Tạo mới', match: ['/jd-library', '/setup'] },
      { href: '/profile', label: 'Hồ sơ', match: ['/profile'] },
    ]
  }
}

export default meta
type Story = StoryObj<typeof NavLinks>

export const Default: Story = {}

export const Admin: Story = {
  args: {
    items: [
      { href: '/sessions', label: 'Phỏng vấn', match: ['/sessions'] },
      { href: '/jd-library', label: 'Tạo mới', match: ['/jd-library', '/setup'] },
      { href: '/profile', label: 'Hồ sơ', match: ['/profile'] },
      { href: '/admin/users', label: 'Quản trị', match: ['/admin'] },
    ]
  }
}
