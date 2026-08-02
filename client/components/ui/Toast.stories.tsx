import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { Toaster } from './Toast'
import { Button } from './Button'
import { toast } from 'sonner'

const meta: Meta<typeof Toaster> = {
  title: 'UI/Feedback/Toast',
  component: Toaster,
  tags: ['autodocs'],
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof Toaster>

export const Default: Story = {
  render: () => (
    <div className="flex min-h-[200px] items-center justify-center">
      <Toaster />
      <Button
        onClick={() => {
          toast('Event has been created', {
            description: 'Sunday, December 03, 2023 at 9:00 AM',
            action: {
              label: 'Undo',
              onClick: () => console.log('Undo'),
            },
          })
        }}
      >
        Show Toast
      </Button>
    </div>
  ),
}

export const Success: Story = {
  render: () => (
    <div className="flex min-h-[200px] items-center justify-center">
      <Toaster />
      <Button
        variant="outline"
        onClick={() => {
          toast.success('Successfully saved data!')
        }}
      >
        Show Success Toast
      </Button>
    </div>
  ),
}

export const ErrorToast: Story = {
  render: () => (
    <div className="flex min-h-[200px] items-center justify-center">
      <Toaster />
      <Button
        variant="destructive"
        onClick={() => {
          toast.error('Failed to save data. Please try again.')
        }}
      >
        Show Error Toast
      </Button>
    </div>
  ),
}
