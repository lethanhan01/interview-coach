import * as React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import ErrorBoundary from './ErrorBoundary'

const meta: Meta<typeof ErrorBoundary> = {
  title: 'UI/Feedback/ErrorBoundary',
  component: ErrorBoundary,
  tags: ['autodocs'],
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof ErrorBoundary>

const BuggyComponent = () => {
  throw new Error('I crashed!')
}

export const Default: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="rounded border p-4">
        This is a normal component wrapped in ErrorBoundary.
      </div>
    </ErrorBoundary>
  ),
}

export const WithError: Story = {
  render: () => (
    <ErrorBoundary>
      <BuggyComponent />
    </ErrorBoundary>
  ),
}

export const CustomFallback: Story = {
  render: () => (
    <ErrorBoundary
      fallback={
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-600">
          Custom error message here!
        </div>
      }
    >
      <BuggyComponent />
    </ErrorBoundary>
  ),
}
