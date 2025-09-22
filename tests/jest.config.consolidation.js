/**
 * Jest Configuration for Consolidation Testing
 * Specialized configuration for testing consolidated components
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Test files patterns
  testMatch: [
    '<rootDir>/tests/consolidation/**/*.test.{js,ts,tsx}',
    '<rootDir>/src/**/*.consolidation.test.{js,ts,tsx}'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/consolidation-test-setup.ts'
  ],
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // File extensions to process
  moduleFileExtensions: [
    'js',
    'jsx', 
    'ts',
    'tsx',
    'json'
  ],
  
  // Transform patterns
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // Files to ignore during transformation
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/tests/coverage/consolidation',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Coverage thresholds for consolidation tests
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    // Stricter thresholds for shared components
    'src/shared/**/*.{ts,tsx}': {
      branches: 95,
      functions: 98,
      lines: 98,
      statements: 98
    }
  },
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'src/shared/**/*.{ts,tsx}',
    'src/**/*.consolidated.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/index.ts'
  ],
  
  // Global setup/teardown
  globalSetup: '<rootDir>/tests/setup/global-setup.ts',
  globalTeardown: '<rootDir>/tests/setup/global-teardown.ts',
  
  // Test timeout
  testTimeout: 30000,
  
  // Snapshot configuration
  snapshotSerializers: [
    '<rootDir>/tests/setup/custom-snapshot-serializer.ts'
  ],
  
  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/tests/results/',
    '<rootDir>/tests/snapshots/',
    '<rootDir>/consolidation-baselines/',
    '<rootDir>/docs/'
  ],
  
  // Performance optimizations
  maxWorkers: '50%',
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-consolidation',
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './tests/reports/consolidation/html',
        filename: 'consolidation-test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Consolidation Test Report'
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './tests/reports/consolidation/junit',
        outputName: 'consolidation-test-results.xml',
        suiteName: 'Consolidation Tests'
      }
    ]
  ],
  
  // Custom test results processor
  testResultsProcessor: '<rootDir>/tests/setup/consolidation-results-processor.js',
  
  // Verbose output for consolidation debugging
  verbose: true,
  
  // Error handling
  bail: false, // Don't stop on first failure
  errorOnDeprecated: true,
  
  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
    '<rootDir>/tests'
  ],
  
  // Custom matchers for consolidation testing
  setupFiles: [
    '<rootDir>/tests/setup/consolidation-matchers.ts'
  ]
}