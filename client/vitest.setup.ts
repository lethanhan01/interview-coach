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

  // Mock ResizeObserver for Mantine v9 in jsdom
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

  // Mock document.fonts for Mantine v9 TextareaAutosize in jsdom
  if (typeof document !== 'undefined' && !('fonts' in document)) {
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        ready: Promise.resolve(),
      },
    })
  }

  // Mock scrollIntoView for Mantine v9 Combobox/Select in jsdom
  HTMLElement.prototype.scrollIntoView = () => {
    // Mock implementation for Vitest
  }
}
