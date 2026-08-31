import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Progress } from './Progress'

const meta = {
  title: 'UI/Display/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    variant: {
      control: 'select',
      options: ['brand', 'default', 'success', 'warning', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 60,
    variant: 'brand',
    size: 'md',
    className: 'w-72',
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-72">
      <div>
        <p className="text-xs text-ink-muted mb-1">Brand (60%)</p>
        <Progress value={60} variant="brand" />
      </div>
      <div>
        <p className="text-xs text-ink-muted mb-1">Success (85%)</p>
        <Progress value={85} variant="success" />
      </div>
      <div>
        <p className="text-xs text-ink-muted mb-1">Warning (45%)</p>
        <Progress value={45} variant="warning" />
      </div>
      <div>
        <p className="text-xs text-ink-muted mb-1">Danger (20%)</p>
        <Progress value={20} variant="danger" />
      </div>
    </div>
  ),
}
