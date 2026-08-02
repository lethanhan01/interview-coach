import type { Meta, StoryObj } from '@storybook/react'
// import { ComponentName } from '@/components/ui/ComponentName';

// Giả lập ComponentName để tránh lỗi khi template chưa có component thực
const ComponentName = (props: any) => (
  <div {...props}>Placeholder Component</div>
)

const meta = {
  title: 'Components/Category/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    // Định nghĩa controls ở đây
  },
} satisfies Meta<typeof ComponentName>

export default meta
type Story = StoryObj<typeof meta>

// 5. Default story
export const Default: Story = {
  args: {
    children: 'Default Content',
  },
}

// 6. Tất cả variant
export const Variants: Story = {
  render: () => (
    <div className="flex gap-4">
      <ComponentName variant="default">Default</ComponentName>
      <ComponentName variant="secondary">Secondary</ComponentName>
      <ComponentName variant="outline">Outline</ComponentName>
    </div>
  ),
}

// 7. Tất cả size
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <ComponentName size="sm">Small</ComponentName>
      <ComponentName size="default">Default</ComponentName>
      <ComponentName size="lg">Large</ComponentName>
    </div>
  ),
}

// 8. Disabled state
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled State',
  },
}

// 9. Loading state nếu có
export const Loading: Story = {
  args: {
    isLoading: true, // Thay thế bằng prop tương ứng của component
    children: 'Loading...',
  },
}

// 10. Invalid state nếu có
export const Invalid: Story = {
  args: {
    'aria-invalid': true, // Hoặc prop isError, error={true}
    children: 'Invalid State',
  },
}

// 11. Dark theme
export const DarkTheme: Story = {
  parameters: {
    themes: {
      themeOverride: 'dark',
    },
  },
  args: {
    children: 'Dark Theme View',
  },
}

// 12. Long content
export const LongContent: Story = {
  args: {
    children:
      'This is a very long text to test how the component handles overflow, text wrapping, and truncation properly without breaking the layout.',
  },
}

// 13. Responsive behavior
export const Responsive: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    children: 'Mobile View',
  },
}
