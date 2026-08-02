import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from './Textarea'
import { Mail } from 'lucide-react'

const meta = {
  title: 'UI/Inputs/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Type your message here.',
    className: 'w-[400px]',
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'Type your message here.',
    disabled: true,
    className: 'w-[400px]',
  },
}

export const ReadOnly: Story = {
  args: {
    value: 'This is a read-only message.',
    readOnly: true,
    className: 'w-[400px]',
  },
}

export const WithCharacterCounter: Story = {
  args: {
    placeholder: 'Describe your experience.',
    charCount: 45,
    maxChars: 100,
    className: 'w-[400px]',
  },
}

export const InvalidState: Story = {
  args: {
    placeholder: 'Type your message here.',
    'aria-invalid': true,
    className: 'w-[400px]',
  },
}

export const WithLeadingIcon: Story = {
  args: {
    placeholder: 'Compose an email...',
    leadingIcon: <Mail className="h-4 w-4" />,
    className: 'w-[400px]',
  },
}
