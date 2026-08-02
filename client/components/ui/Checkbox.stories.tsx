import type { Meta, StoryObj } from '@storybook/react'
import { Checkbox } from './Checkbox'
import { Label } from './Label'

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Inputs/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" {...args} />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
}

export const Indeterminate: Story = {
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Checkbox id="indeterminate" indeterminate {...args} />
      <Label htmlFor="indeterminate">Indeterminate</Label>
    </div>
  ),
}

export const Disabled: Story = {
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Checkbox id="disabled" disabled {...args} />
      <Label htmlFor="disabled" className="opacity-50">Disabled checkbox</Label>
    </div>
  ),
}

export const Invalid: Story = {
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Checkbox id="invalid" aria-invalid="true" {...args} />
      <Label htmlFor="invalid" className="text-destructive">Invalid checkbox</Label>
    </div>
  ),
}
