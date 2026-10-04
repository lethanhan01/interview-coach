import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import ConfigForm from './ConfigForm'
import type { SessionType, ContextPack } from '@/lib/types'
import type { InterviewDuration } from '@/lib/setup-types'

const meta: Meta<typeof ConfigForm> = {
  title: 'Feature/Setup/ConfigForm',
  component: ConfigForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof ConfigForm>

function ConfigFormController(
  args: Partial<React.ComponentProps<typeof ConfigForm>>
) {
  const [sessionType, setSessionType] = useState<SessionType>('hr')
  const [contextPack, setContextPack] = useState<ContextPack>('VN')
  const [duration, setDuration] = useState<InterviewDuration>(30)

  return (
    <ConfigForm
      {...args}
      sessionType={sessionType}
      setSessionType={setSessionType}
      contextPack={contextPack}
      setContextPack={setContextPack}
      duration={duration}
      setDuration={setDuration}
    />
  )
}

export const Default: Story = {
  render: (args) => <ConfigFormController {...args} />,
}

export const HrSelected: Story = {
  args: {
    sessionType: 'hr',
    contextPack: 'VN',
    duration: 30,
    setSessionType: () => {},
    setContextPack: () => {},
    setDuration: () => {},
  },
}

export const TechnicalWestern: Story = {
  args: {
    sessionType: 'technical',
    contextPack: 'Western',
    duration: 60,
    setSessionType: () => {},
    setContextPack: () => {},
    setDuration: () => {},
  },
}

export const TechnicalLong: Story = {
  args: {
    sessionType: 'technical',
    contextPack: 'VN',
    duration: 90,
    setSessionType: () => {},
    setContextPack: () => {},
    setDuration: () => {},
  },
}
