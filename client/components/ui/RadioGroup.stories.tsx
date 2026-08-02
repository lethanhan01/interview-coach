import type { Meta, StoryObj } from '@storybook/react'
import { RadioGroup, RadioGroupItem } from './RadioGroup'
import { Label } from './Label'

const meta: Meta<typeof RadioGroup> = {
  title: 'UI/Inputs/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof RadioGroup>

export const Default: Story = {
  render: (args) => (
    <RadioGroup defaultValue="comfortable" {...args}>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="default" id="r1" />
        <Label htmlFor="r1">Default</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="comfortable" id="r2" />
        <Label htmlFor="r2">Comfortable</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="compact" id="r3" />
        <Label htmlFor="r3">Compact</Label>
      </div>
    </RadioGroup>
  ),
}

export const Disabled: Story = {
  render: (args) => (
    <RadioGroup defaultValue="1" disabled {...args}>
      <div className="flex items-center space-x-2 opacity-50">
        <RadioGroupItem value="1" id="d1" />
        <Label htmlFor="d1">Option 1</Label>
      </div>
      <div className="flex items-center space-x-2 opacity-50">
        <RadioGroupItem value="2" id="d2" />
        <Label htmlFor="d2">Option 2</Label>
      </div>
    </RadioGroup>
  ),
}

export const Invalid: Story = {
  render: (args) => (
    <RadioGroup defaultValue="1" {...args}>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="1" id="i1" aria-invalid="true" />
        <Label htmlFor="i1" className="text-destructive">Invalid Option 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="2" id="i2" aria-invalid="true" />
        <Label htmlFor="i2" className="text-destructive">Invalid Option 2</Label>
      </div>
    </RadioGroup>
  ),
}
