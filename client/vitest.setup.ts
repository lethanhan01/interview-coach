import '@testing-library/jest-dom/vitest'
import { expect } from 'vitest'
import { toHaveNoViolations } from 'jest-axe'

// Extend vitest expect with jest-axe matchers
expect.extend(toHaveNoViolations)

// Mock ResizeObserver for Radix UI
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
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

// Mock HTMLElement.prototype.hasPointerCapture for Radix UI
HTMLElement.prototype.hasPointerCapture = () => false
HTMLElement.prototype.setPointerCapture = () => {}
HTMLElement.prototype.releasePointerCapture = () => {}
