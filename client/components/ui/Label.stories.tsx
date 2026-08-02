import type { Meta, StoryObj } from '@storybook/react'
import { Label } from './Label'
import { Input } from './Input'

const meta: Meta<typeof Label> = {
  title: 'UI/Inputs/Label',
  component: Label,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
}
export default meta
type Story = StoryObj<typeof Label>

export const Default: Story = {
  args: {
    children: 'Label văn bản',
  },
}

export const WithInput: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Input id="terms" type="checkbox" />
      <Label htmlFor="terms">Chấp nhận điều khoản và dịch vụ</Label>
    </div>
  ),
}
