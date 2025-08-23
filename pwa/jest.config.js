module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js',
    '!src/serviceWorker.js',
    '!src/reportWebVitals.js',
    '!src/setupTests.js',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.js'
  ],
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/__mocks__/fileMock.js'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.(css|less|scss|sass)$': 'jest-transform-css'
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(react-native|@react-native|@react-navigation|react-native-vector-icons|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@react-native-community|react-native-svg|react-native-linear-gradient|react-native-image-picker|react-native-camera|react-native-barcode-scanner|react-native-permissions|react-native-device-info|react-native-fs|react-native-sqlite-storage|react-native-async-storage|react-native-keychain|react-native-biometrics|react-native-encrypted-storage|react-native-background-job|react-native-background-fetch|react-native-background-upload|react-native-background-download|react-native-background-timer|react-native-background-task|react-native-background-actions|react-native-background-geolocation|react-native-background-push-notification|react-native-background-app-refresh|react-native-background-fetch|react-native-background-upload|react-native-background-download|react-native-background-timer|react-native-background-task|react-native-background-actions|react-native-background-geolocation|react-native-background-push-notification|react-native-background-app-refresh)/)'
  ],
  
  // Module file extensions
  moduleFileExtensions: [
    'js',
    'jsx',
    'ts',
    'tsx',
    'json',
    'node'
  ],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Reset modules between tests
  resetModules: true,
  
  // Test results processor
  testResultsProcessor: 'jest-sonar-reporter',
  
  // Collect coverage
  collectCoverage: true,
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Coverage path ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/build/',
    '/dist/',
    '/public/',
    '/src/setupTests.js',
    '/src/reportWebVitals.js',
    '/src/serviceWorker.js'
  ],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/src/__tests__/setup/globalSetup.js',
  globalTeardown: '<rootDir>/src/__tests__/setup/globalTeardown.js',
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Extra globals
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  
  // Projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.integration.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom'
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.e2e.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom'
    }
  ],
  
  // Reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]
  ]
};
