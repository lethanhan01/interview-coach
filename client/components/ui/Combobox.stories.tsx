import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Combobox } from './Combobox'
import { useState } from 'react'

const meta = {
  title: 'UI/Inputs/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

const frameworks = [
  { value: 'next.js', label: 'Next.js' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt.js', label: 'Nuxt.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
]

export const Default: Story = {
  args: {
    options: frameworks,
  },
  render: () => {
    const [value, setValue] = useState('')
    return (
      <div className="w-[300px]">
        <Combobox
          options={frameworks}
          value={value}
          onValueChange={setValue}
          placeholder="Select framework..."
        />
      </div>
    )
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    options: frameworks,
    placeholder: 'Disabled...',
  },
}
