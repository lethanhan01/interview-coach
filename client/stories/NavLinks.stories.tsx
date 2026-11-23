import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import NavLinks from '@/components/layout/NavLinks'
import { adminNavigation, candidateNavigation } from '@/config/navigation'

const meta: Meta<typeof NavLinks> = {
  title: 'Layout/NavLinks',
  component: NavLinks,
  tags: ['autodocs'],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/sessions',
      },
    },
  },
  args: {
    items: candidateNavigation,
    orientation: 'horizontal',
  },
}

export default meta
type Story = StoryObj<typeof NavLinks>

export const Default: Story = {}

export const VerticalExpanded: Story = {
  args: {
    items: adminNavigation,
    orientation: 'vertical',
    collapsed: false,
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/admin/users',
      },
    },
  },
}

export const VerticalMiniRail: Story = {
  args: {
    items: adminNavigation,
    orientation: 'vertical',
    collapsed: true,
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/admin/onet',
      },
    },
  },
}
