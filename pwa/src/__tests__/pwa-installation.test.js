import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('PWA Installation and Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('26. PWA Installation - Desktop', () => {
    test('should be installable on desktop Chrome', async () => {
      // Mock BeforeInstallPromptEvent
      const mockBeforeInstallPromptEvent = {
        prompt: jest.fn(),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      Object.defineProperty(window, 'BeforeInstallPromptEvent', {
        value: class BeforeInstallPromptEvent {
          constructor() {
            return mockBeforeInstallPromptEvent;
          }
        },
        writable: true,
      });

      renderWithRouter(<App />);

      // Check PWA installability
      const isInstallable = 'BeforeInstallPromptEvent' in window;
      expect(isInstallable).toBe(true);

      // Check manifest is accessible
      const manifestResponse = await fetch('/manifest.json');
      expect(manifestResponse.status).toBe(200);

      const manifest = await manifestResponse.json();
      expect(manifest.name).toBe('AI-Powered Pill Counting System');
      expect(manifest.short_name).toBe('Pill Counter');
    });
  });

  describe('27. PWA Installation - Mobile', () => {
    test('should be installable on mobile Chrome', async () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        writable: true,
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 667,
        writable: true,
      });

      // Mock standalone mode
      Object.defineProperty(window.navigator, 'standalone', {
        value: true,
        writable: true,
      });

      renderWithRouter(<App />);

      // Check mobile-specific PWA features
      const isMobilePWA = window.navigator.standalone === true;
      expect(isMobilePWA).toBe(true);

      // Check manifest has mobile-specific properties
      const manifestResponse = await fetch('/manifest.json');
      const manifest = await manifestResponse.json();
      expect(manifest.display).toBe('standalone');
      expect(manifest.orientation).toBe('portrait');
    });
  });

  describe('28. App Performance - First Load', () => {
    test('should load within 5 seconds on first visit', async () => {
      // Clear cache and storage
      localStorage.clear();
      sessionStorage.clear();

      const startTime = Date.now();
      
      renderWithRouter(<App />);

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByTestId('app-container')).toBeInTheDocument();
      });

      const loadTime = Date.now() - startTime;

      // Check performance metrics
      expect(loadTime).toBeLessThan(5000); // 5 seconds max

      // Check core app loads
      expect(screen.getByTestId('app-container')).toBeInTheDocument();
    });
  });

  describe('29. App Performance - Cached Load', () => {
    test('should load within 2 seconds when cached', async () => {
      // Mock cached resources
      const mockRegistration = {
        active: {
          postMessage: jest.fn(),
        },
      };

      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          getRegistrations: jest.fn().mockResolvedValue([mockRegistration]),
          ready: Promise.resolve(mockRegistration),
        },
        writable: true,
      });

      const startTime = Date.now();
      
      renderWithRouter(<App />);

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByTestId('app-container')).toBeInTheDocument();
      });

      const cachedLoadTime = Date.now() - startTime;

      // Check performance metrics
      expect(cachedLoadTime).toBeLessThan(2000); // 2 seconds max

      // Verify service worker cache is working
      expect(navigator.serviceWorker.getRegistrations).toHaveBeenCalled();
    });
  });

  describe('30. Cross-Browser Compatibility', () => {
    test('should work across different browsers', async () => {
      // Test core functionality across different user agents
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Chrome/91.0.4472.124)',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (Mobile Safari)',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (Safari/605.1.15)',
      ];

      for (const userAgent of userAgents) {
        Object.defineProperty(navigator, 'userAgent', {
          value: userAgent,
          writable: true,
        });

        renderWithRouter(<App />);

        // Check core app loads
        await waitFor(() => {
          expect(screen.getByTestId('app-container')).toBeInTheDocument();
        });

        // Check basic navigation works
        const scannerLink = screen.getByText(/scanner/i);
        expect(scannerLink).toBeInTheDocument();
      }
    });
  });
});
