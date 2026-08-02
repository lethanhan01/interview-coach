import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from './Button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './Popover'

const meta: Meta<typeof Popover> = {
  title: 'UI/Overlay/Popover',
  component: Popover,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-10 flex items-center justify-center min-h-[300px]">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Popover>

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">
              Set the dimensions for the layer.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

export const Placements: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Top</Button>
        </PopoverTrigger>
        <PopoverContent side="top">
          <p>Popover on top</p>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Right</Button>
        </PopoverTrigger>
        <PopoverContent side="right">
          <p>Popover on right</p>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </PopoverTrigger>
        <PopoverContent side="bottom">
          <p>Popover on bottom</p>
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Left</Button>
        </PopoverTrigger>
        <PopoverContent side="left">
          <p>Popover on left</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
}
