/**
 * Test Setup for Consolidation Testing
 * Configures testing environment for consolidated components
 */

import '@testing-library/jest-dom'

// Mock implementations for common dependencies
global.fetch = require('jest-fetch-mock')

// Mock crypto for UUID generation in tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
  }
})

// Mock ResizeObserver which might be used by UI components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

// Mock console methods for cleaner test output
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeEach(() => {
  // Suppress React warnings in tests unless DEBUG is set
  if (!process.env.DEBUG) {
    console.error = jest.fn()
    console.warn = jest.fn()
  }
})

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  
  // Clear all mocks
  jest.clearAllMocks()
})

// Global test utilities
global.testUtils = {
  // Helper to create mock props for components
  createMockProps: (overrides = {}) => ({
    id: 'test-id',
    className: 'test-class',
    'data-testid': 'test-component',
    ...overrides
  }),
  
  // Helper to create mock event objects
  createMockEvent: (type = 'click', overrides = {}) => ({
    type,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: { value: 'test-value' },
    ...overrides
  }),
  
  // Helper to wait for async operations
  waitForAsync: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // Helper to create mock API responses
  createMockApiResponse: (data = {}, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  })
}

// Custom matchers for consolidation testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeConsolidationCompatible(): R
      toHaveEquivalentBehavior(expected: any): R
      toMeetPerformanceThreshold(baseline: any): R
    }
  }
}

// Add custom Jest matchers
expect.extend({
  // Check if component is compatible with consolidation patterns
  toBeConsolidationCompatible(received) {
    const pass = received && 
                 typeof received === 'object' &&
                 (received.displayName || received.name) &&
                 typeof received.render === 'function' || 
                 typeof received === 'function'

    if (pass) {
      return {
        message: () => `expected ${received} not to be consolidation compatible`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to be consolidation compatible (should have name and render method or be a function)`,
        pass: false
      }
    }
  },

  // Check if two implementations have equivalent behavior
  toHaveEquivalentBehavior(received, expected) {
    // Simple deep equality check for test purposes
    const pass = JSON.stringify(received) === JSON.stringify(expected)

    if (pass) {
      return {
        message: () => `expected ${received} not to have equivalent behavior to ${expected}`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to have equivalent behavior to ${expected}`,
        pass: false
      }
    }
  },

  // Check if performance meets threshold
  toMeetPerformanceThreshold(received, baseline) {
    const threshold = 1.1 // 10% degradation allowed
    const pass = received.renderTime <= baseline.renderTime * threshold &&
                 received.memoryUsage <= baseline.memoryUsage * threshold

    if (pass) {
      return {
        message: () => `expected performance to not meet threshold`,
        pass: true
      }
    } else {
      return {
        message: () => `expected performance to meet threshold (render: ${received.renderTime}ms <= ${baseline.renderTime * threshold}ms, memory: ${received.memoryUsage}MB <= ${baseline.memoryUsage * threshold}MB)`,
        pass: false
      }
    }
  }
})

// Setup fake timers for testing
beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
})

console.log('🧪 Consolidation test setup completed')