import '@testing-library/jest-dom/vitest'

// React selects a prefixed animation event when this browser constructor is
// absent. jsdom has no animation clock, but our lifecycle tests dispatch the
// standard animationend event explicitly, as real supported browsers do.
if (!('AnimationEvent' in window)) Object.defineProperty(window, 'AnimationEvent', { value: Event, configurable: true })

// jsdom does not implement matchMedia; mock with a default of "not reduced motion"
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
})

// jsdom does not implement IntersectionObserver
class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
  root = null
  rootMargin = ''
  thresholds = []
}
;(globalThis as unknown as { IntersectionObserver: typeof IO }).IntersectionObserver = IO

// jsdom does not implement ResizeObserver
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
;(globalThis as unknown as { ResizeObserver: typeof RO }).ResizeObserver = RO
