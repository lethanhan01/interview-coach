import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { ArrowRight, Loader2, Mail, Trash2 } from 'lucide-react'

import { Button } from './Button'

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta = {
  title: 'UI/Inputs/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Button là UI Primitive reference implementation của Design System. Nó tuân thủ đầy đủ Component Contract (xem `docs/design-system/06-component-contract.md`).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'outline',
        'ghost',
        'destructive',
        'link',
      ],
      description: 'Kiểu hiển thị của button',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
      description: 'Kích thước của button',
    },
    loading: {
      control: 'boolean',
      description: 'Hiển thị spinner và vô hiệu hóa button',
    },
    disabled: {
      control: 'boolean',
      description: 'Vô hiệu hóa button',
    },
    asChild: {
      control: 'boolean',
      description: 'Render như phần tử con (ví dụ: <a>, Next.js Link)',
    },
    children: {
      control: 'text',
    },
  },
  args: {
    onClick: fn(),
    children: 'Button',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// ---------------------------------------------------------------------------
// Playground
// ---------------------------------------------------------------------------

/**
 * Sử dụng Controls panel để thử tất cả props.
 */
export const Playground: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Click me',
  },
}

// ---------------------------------------------------------------------------
// All Variants
// ---------------------------------------------------------------------------

export const Primary: Story = {
  args: { variant: 'primary', children: 'Primary' },
}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secondary' },
}

export const Outline: Story = {
  args: { variant: 'outline', children: 'Outline' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
}

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Xóa tài khoản' },
}

export const Link: Story = {
  args: { variant: 'link', children: 'Xem chi tiết' },
}

/**
 * Tất cả variants cùng một lúc để dễ so sánh.
 */
export const AllVariants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="destructive">
        Destructive
      </Button>
      <Button {...args} variant="link">
        Link
      </Button>
    </div>
  ),
}

// ---------------------------------------------------------------------------
// All Sizes
// ---------------------------------------------------------------------------

export const Small: Story = {
  args: { size: 'sm', children: 'Small' },
}

export const Medium: Story = {
  args: { size: 'md', children: 'Medium' },
}

export const Large: Story = {
  args: { size: 'lg', children: 'Large' },
}

/**
 * Tất cả sizes cùng một lúc.
 */
export const AllSizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-end gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

export const Loading: Story = {
  args: { loading: true, children: 'Đang tải...' },
  parameters: {
    docs: {
      description: {
        story:
          'Loading state: chiều rộng button không thay đổi nhờ overlay technique.',
      },
    },
  },
}

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
}

export const LoadingVsNormal: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args}>Bình thường</Button>
      <Button {...args} loading>
        Đang tải...
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'So sánh chiều rộng khi loading vs không loading — phải bằng nhau.',
      },
    },
  },
}

// ---------------------------------------------------------------------------
// With Icons
// ---------------------------------------------------------------------------

export const WithLeftIcon: Story = {
  render: (args) => (
    <Button {...args}>
      <Mail className="size-4" />
      Gửi email
    </Button>
  ),
  parameters: {
    docs: { description: { story: 'Icon bên trái, text bên phải.' } },
  },
}

export const WithRightIcon: Story = {
  render: (args) => (
    <Button {...args}>
      Tiếp theo
      <ArrowRight className="size-4" />
    </Button>
  ),
  parameters: {
    docs: { description: { story: 'Icon bên phải, text bên trái.' } },
  },
}

/**
 * Icon-only button PHẢI có aria-label để đảm bảo accessibility.
 */
export const IconOnly: Story = {
  args: {
    size: 'icon',
    variant: 'destructive',
    'aria-label': 'Xóa mục này',
    children: <Trash2 className="size-4" />,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Icon-only button. `aria-label` là bắt buộc để screen reader đọc được. Bỏ aria-label sẽ vi phạm Component Contract.',
      },
    },
  },
}

export const IconOnlyLoading: Story = {
  args: {
    size: 'icon',
    loading: true,
    'aria-label': 'Đang xóa...',
    children: <Trash2 className="size-4" />,
  },
}

// ---------------------------------------------------------------------------
// asChild — render as <a>
// ---------------------------------------------------------------------------

export const AsLink: Story = {
  render: (args) => (
    <Button {...args} asChild variant="outline">
      <a href="https://example.com" target="_blank" rel="noreferrer">
        Mở trang web
      </a>
    </Button>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`asChild` render button styles lên thẻ `<a>` bên trong. Hữu ích khi cần link có kiểu dáng button.',
      },
    },
  },
}

// ---------------------------------------------------------------------------
// Dark Theme
// ---------------------------------------------------------------------------

/**
 * Storybook addon-themes sẽ toggle class `dark` lên `<html>`.
 * Story này luôn được xem ở Dark mode (dùng globals trong toolbar).
 */
export const DarkMode: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="destructive">
        Destructive
      </Button>
      <Button {...args} variant="link">
        Link
      </Button>
    </div>
  ),
  parameters: {
    themes: { themeOverride: 'dark' },
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story:
          'Tất cả variants ở Dark mode. Toggle theme trong toolbar để so sánh.',
      },
    },
  },
}
