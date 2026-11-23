import '@testing-library/jest-dom/vitest'
import { expect, vi } from 'vitest'
import { toHaveNoViolations } from 'jest-axe'

// Extend vitest expect with jest-axe matchers
expect.extend(toHaveNoViolations)

// Browser/jsdom mocks (skipped for `@vitest-environment node` suites)
if (typeof window !== 'undefined') {
  // Mock matchMedia for Mantine v9 in jsdom
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Safe getComputedStyle fallback for Mantine v9 in jsdom
  const { getComputedStyle } = window
  window.getComputedStyle = (elt) => getComputedStyle(elt)

  // Mock ResizeObserver for Radix UI & Mantine v9
  class ResizeObserverMock {
    observe() {
      // Mock implementation for Vitest
    }
    unobserve() {
      // Mock implementation for Vitest
    }
    disconnect() {
      // Mock implementation for Vitest
    }
  }
  window.ResizeObserver = ResizeObserverMock

  // Mock PointerEvent for Radix UI
  if (typeof window.PointerEvent === 'undefined') {
    class PointerEventMock extends Event {
      pointerId: number
      constructor(type: string, props: PointerEventInit = {}) {
        super(type, props)
        this.pointerId = props.pointerId || 0
      }
    }
    window.PointerEvent = PointerEventMock as unknown as typeof PointerEvent
  }

  // Mock HTMLElement.prototype helpers for Radix UI & Mantine v9
  HTMLElement.prototype.scrollIntoView = () => {
    // Mock implementation for Vitest
  }
  HTMLElement.prototype.hasPointerCapture = () => false
  HTMLElement.prototype.setPointerCapture = () => {
    // Mock implementation for Vitest
  }
  HTMLElement.prototype.releasePointerCapture = () => {
    // Mock implementation for Vitest
  }
}
