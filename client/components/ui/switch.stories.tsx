import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Switch } from './Switch'
import { Label } from './Label'

const meta: Meta<typeof Switch> = {
  title: 'UI/Inputs/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
        ],
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Switch>

export const Default: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
}

export const Checked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="checked" defaultChecked />
      <Label htmlFor="checked">Airplane Mode (Checked)</Label>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="disabled" disabled />
      <Label htmlFor="disabled">Airplane Mode (Disabled)</Label>
    </div>
  ),
}

export const Invalid: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="invalid" aria-invalid="true" />
      <Label htmlFor="invalid">Airplane Mode (Invalid)</Label>
    </div>
  ),
}
