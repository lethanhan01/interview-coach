import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './Card'
import { Button } from './Button'

const meta = {
  title: 'UI/Display/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-ink-muted">
          Project setup contents go here...
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  ),
}

export const Hoverable: Story = {
  render: () => (
    <Card hover className="w-[350px]">
      <CardHeader>
        <CardTitle>Interactive Card</CardTitle>
        <CardDescription>Hover over me to see the effect.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm">Great for clickable list items or grids.</div>
      </CardContent>
    </Card>
  ),
}
