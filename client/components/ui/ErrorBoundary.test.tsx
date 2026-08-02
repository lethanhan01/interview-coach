import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary'
import { axe } from 'jest-axe'

// Prevent React's default error logging from cluttering the test output
const originalError = console.error
beforeAll(() => {
  console.error = vi.fn()
})
afterAll(() => {
  console.error = originalError
})

describe('ErrorBoundary Component', () => {
  const BuggyComponent = () => {
    throw new Error('Test Error')
  }

  it('renders children if there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Normal content')).toBeInTheDocument()
  })

  it('renders default fallback if an error occurs', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Đã xảy ra lỗi. Vui lòng tải lại trang.')).toBeInTheDocument()
  })

  it('renders custom fallback if provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error Content</div>}>
        <BuggyComponent />
      </ErrorBoundary>
    )
    expect(screen.getByText('Custom Error Content')).toBeInTheDocument()
  })

  it('passes accessibility tests when showing fallback', async () => {
    const { container } = render(
      <ErrorBoundary>
        <BuggyComponent />
      </ErrorBoundary>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
