import { Text } from '@mantine/core'
import { render, screen, userEvent } from '@test-utils'
import { axe } from 'jest-axe'
import { vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary'

const originalError = console.error

beforeAll(() => {
  console.error = vi.fn()
})

afterAll(() => {
  console.error = originalError
})

function ThrowingChild({ shouldThrow }: Readonly<{ shouldThrow: boolean }>) {
  if (shouldThrow) {
    throw new Error('Test crash')
  }
  return <Text>Nội dung bình thường</Text>
}

describe('ErrorBoundary (patterns)', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Nội dung bình thường')).toBeInTheDocument()
  })

  it('catches errors, renders Mantine fallback, and recovers on retry', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    let shouldThrow = true

    function DynamicChild() {
      if (shouldThrow) {
        throw new Error('Transient error')
      }
      return <Text>Khôi phục thành công</Text>
    }

    render(
      <ErrorBoundary onReset={onReset}>
        <DynamicChild />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Đã xảy ra lỗi hiển thị')).toBeInTheDocument()

    shouldThrow = false
    await user.click(screen.getByRole('button', { name: 'Thử lại' }))

    expect(onReset).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Khôi phục thành công')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<Text>Custom Fallback</Text>}>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument()
  })

  it('has no accessibility violations in fallback state', async () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})
