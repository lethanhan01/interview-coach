import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Input } from './Input'
import { Label } from './Label'

const meta: Meta<typeof Input> = {
  title: 'UI/Inputs/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
}
export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    placeholder: 'Nhập nội dung...',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Đã bị vô hiệu hóa',
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Email của bạn" />
    </div>
  ),
}
