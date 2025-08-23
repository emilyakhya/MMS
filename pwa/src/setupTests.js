// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock service worker for API testing
import { server } from './mocks/server';

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers();
  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
});

// Clean up after the tests are finished
afterAll(() => server.close());

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{
        stop: jest.fn(),
        getSettings: () => ({ width: 640, height: 480 })
      }]
    }),
    enumerateDevices: jest.fn().mockResolvedValue([
      { deviceId: 'default', label: 'Default Camera', kind: 'videoinput' }
    ])
  }
});

// Mock IndexedDB
const indexedDB = {
  open: jest.fn().mockReturnValue({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    result: {
      createObjectStore: jest.fn(),
      transaction: jest.fn().mockReturnValue({
        objectStore: jest.fn().mockReturnValue({
          add: jest.fn(),
          get: jest.fn(),
          getAll: jest.fn(),
          put: jest.fn(),
          delete: jest.fn(),
          clear: jest.fn()
        })
      })
    }
  })
};

Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: indexedDB
});

// Mock service worker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: jest.fn().mockResolvedValue({
      active: { postMessage: jest.fn() },
      updateViaCache: 'none'
    }),
    getRegistrations: jest.fn().mockResolvedValue([]),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
});

// Mock PWA install prompt
Object.defineProperty(window, 'beforeinstallprompt', {
  writable: true,
  value: jest.fn()
});

// Mock online/offline status
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true
});

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  value: {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(),
    clearWatch: jest.fn()
  }
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: jest.fn().mockResolvedValue(),
    readText: jest.fn().mockResolvedValue('')
  }
});

// Mock file system access API
Object.defineProperty(window, 'showOpenFilePicker', {
  writable: true,
  value: jest.fn().mockResolvedValue([])
});

// Mock web share API
Object.defineProperty(navigator, 'share', {
  writable: true,
  value: jest.fn().mockResolvedValue()
});

// Mock device orientation
Object.defineProperty(window, 'DeviceOrientationEvent', {
  writable: true,
  value: class DeviceOrientationEvent {
    constructor() {}
  }
});

// Mock device motion
Object.defineProperty(window, 'DeviceMotionEvent', {
  writable: true,
  value: class DeviceMotionEvent {
    constructor() {}
  }
});

// Mock battery API
Object.defineProperty(navigator, 'getBattery', {
  writable: true,
  value: jest.fn().mockResolvedValue({
    level: 0.8,
    charging: true,
    chargingTime: 0,
    dischargingTime: Infinity,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  })
});

// Mock network information
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => [])
  }
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

// Suppress specific console warnings that are expected in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
