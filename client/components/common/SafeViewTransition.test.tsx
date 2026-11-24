import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Button, Stack, Text } from '@mantine/core'
import { render, screen, userEvent } from '@test-utils'
import {
  DIRECTIONAL_VIEW_TRANSITION_ENTER,
  DIRECTIONAL_VIEW_TRANSITION_EXIT,
  SafeViewTransition,
  startTypedTransition,
} from './SafeViewTransition'

function TypedTransitionDemo() {
  const [step, setStep] = useState(1)

  return (
    <SafeViewTransition
      name="demo-step"
      enter={DIRECTIONAL_VIEW_TRANSITION_ENTER}
      exit={DIRECTIONAL_VIEW_TRANSITION_EXIT}
    >
      <Stack gap="xs">
        <Text>Bước hiện tại: {step}</Text>
        <Button
          type="button"
          color="brand"
          onClick={() => {
            startTypedTransition('nav-forward', () => setStep((s) => s + 1))
          }}
        >
          Tiếp theo
        </Button>
        <Button
          type="button"
          color="neutral"
          onClick={() => {
            startTypedTransition(['nav-back', 'step-change'], () =>
              setStep((s) => Math.max(1, s - 1))
            )
          }}
        >
          Quay lại
        </Button>
      </Stack>
    </SafeViewTransition>
  )
}

describe('SafeViewTransition & startTypedTransition', () => {
  it('renders children via passthrough fallback cleanly under Vitest React 19.2.4', () => {
    render(
      <SafeViewTransition enter="slide-from-right" exit="slide-to-left">
        <Text>Nội dung an toàn</Text>
      </SafeViewTransition>
    )

    expect(screen.getByText('Nội dung an toàn')).toBeInTheDocument()
  })

  it('executes state updates with single and array transition types without crashing', async () => {
    const user = userEvent.setup()
    render(<TypedTransitionDemo />)

    expect(screen.getByText('Bước hiện tại: 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tiếp theo' }))
    expect(await screen.findByText('Bước hiện tại: 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Quay lại' }))
    expect(await screen.findByText('Bước hiện tại: 1')).toBeInTheDocument()
  })

  it('exports directional view transition class maps with default none', () => {
    expect(DIRECTIONAL_VIEW_TRANSITION_ENTER).toEqual({
      'nav-forward': 'slide-from-right',
      'nav-back': 'slide-from-left',
      default: 'none',
    })
    expect(DIRECTIONAL_VIEW_TRANSITION_EXIT).toEqual({
      'nav-forward': 'slide-to-left',
      'nav-back': 'slide-to-right',
      default: 'none',
    })
  })
})
