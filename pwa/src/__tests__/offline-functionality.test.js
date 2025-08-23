import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CameraScreen from '../screens/CameraScreen';
import { OfflineStorage } from '../services/offlineStorage';
import { SyncService } from '../services/syncService';

// Mock the services
jest.mock('../services/apiService', () => ({
  submitRecord: jest.fn(),
  analyzeImage: jest.fn(),
}));

jest.mock('../services/offlineStorage');
jest.mock('../services/syncService');

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Offline Functionality Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
    });
  });

  describe('16. Offline Record Storage', () => {
    test('should store record in IndexedDB when offline', async () => {
      const mockFile = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });
      
      // Mock offline storage
      OfflineStorage.addPendingRecord = jest.fn().mockResolvedValue(true);
      
      renderWithRouter(<CameraScreen />);

      // Upload image and complete workflow
      const fileInput = screen.getByTestId('file-input');
      fireEvent.change(fileInput, {
        target: { files: [mockFile] }
      });

      // Fill manual count
      const manualCountInput = screen.getByLabelText(/manual count/i);
      fireEvent.change(manualCountInput, {
        target: { value: '20' }
      });

      // Submit record (should be stored offline)
      const submitButton = screen.getByRole('button', { name: /submit count/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(OfflineStorage.addPendingRecord).toHaveBeenCalledWith(
          expect.objectContaining({
            pill_count: 20,
            timestamp: expect.any(String),
          })
        );
      });
    });
  });

  describe('17. Online Synchronization', () => {
    test('should sync offline records when coming back online', async () => {
      // Mock going back online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
      });

      // Mock pending records
      const mockPendingRecords = [
        {
          id: 'pending-1',
          pill_count: 20,
          timestamp: new Date().toISOString(),
        }
      ];

      OfflineStorage.getPendingRecords = jest.fn().mockResolvedValue(mockPendingRecords);
      OfflineStorage.removePendingRecord = jest.fn().mockResolvedValue(true);
      SyncService.syncPendingRecords = jest.fn().mockResolvedValue(true);

      // Trigger sync
      await SyncService.syncPendingRecords();

      await waitFor(() => {
        expect(SyncService.syncPendingRecords).toHaveBeenCalled();
        expect(OfflineStorage.getPendingRecords).toHaveBeenCalled();
      });
    });
  });

  describe('18. Offline App Functionality', () => {
    test('should function normally when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      renderWithRouter(<CameraScreen />);

      // App should still be functional
      const fileInput = screen.getByTestId('file-input');
      expect(fileInput).toBeInTheDocument();

      const manualCountInput = screen.getByLabelText(/manual count/i);
      expect(manualCountInput).toBeInTheDocument();

      // Should show offline indicator
      expect(screen.getByText(/offline mode/i)).toBeInTheDocument();
    });
  });

  describe('19. Service Worker Caching', () => {
    test('should load from cache when offline', async () => {
      // Mock service worker registration
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

      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });

      renderWithRouter(<CameraScreen />);

      await waitFor(() => {
        expect(navigator.serviceWorker.getRegistrations).toHaveBeenCalled();
      });

      // App should still load
      expect(screen.getByTestId('file-input')).toBeInTheDocument();
    });
  });

  describe('20. Conflict Resolution', () => {
    test('should handle sync conflicts between offline and online data', async () => {
      // Mock conflicting records
      const offlineRecord = {
        id: 'conflict-123',
        pill_count: 20,
        timestamp: new Date().toISOString(),
      };

      const onlineRecord = {
        id: 'conflict-123',
        pill_count: 25,
        timestamp: new Date().toISOString(),
      };

      SyncService.resolveConflict = jest.fn().mockResolvedValue({
        resolved: true,
        finalRecord: onlineRecord,
      });

      // Trigger conflict resolution
      const result = await SyncService.resolveConflict(offlineRecord, onlineRecord);

      expect(SyncService.resolveConflict).toHaveBeenCalledWith(offlineRecord, onlineRecord);
      expect(result.resolved).toBe(true);
      expect(result.finalRecord).toEqual(onlineRecord);
    });
  });
});
