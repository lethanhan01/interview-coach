import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ThemeToggle } from './ThemeToggle'
import { ThemeProvider } from 'next-themes'

const meta: Meta<typeof ThemeToggle> = {
  title: 'UI/Inputs/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Story />
      </ThemeProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ThemeToggle>

export const Default: Story = {
  render: () => (
    <div className="flex h-32 items-center justify-center bg-background text-foreground border border-border p-4 rounded-md">
      <div className="flex flex-col items-center gap-4">
        <span>Click the button to cycle through themes (Light - Dark - System)</span>
        <ThemeToggle />
      </div>
    </div>
  ),
}
