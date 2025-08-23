import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BarcodeScannerScreen from '../screens/BarcodeScannerScreen';

// Mock the barcode scanning library
jest.mock('@zxing/library', () => ({
  BrowserMultiFormatReader: jest.fn().mockImplementation(() => ({
    decodeFromVideoDevice: jest.fn(),
    reset: jest.fn(),
    listVideoInputDevices: jest.fn().mockResolvedValue([
      { deviceId: 'test-camera', label: 'Test Camera', kind: 'videoinput' }
    ]),
  })),
}));

// Mock camera API
const mockGetUserMedia = jest.fn();
Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
  value: mockGetUserMedia,
  writable: true,
});

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Barcode Scanner Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockResolvedValue({
      getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
    });
  });

  describe('6. Barcode Scanner - Camera Access', () => {
    test('should access camera and display video stream', async () => {
      renderWithRouter(<BarcodeScannerScreen />);

      // Wait for camera access request
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true });
      });

      // Check that video element is present
      const videoElement = screen.getByRole('video');
      expect(videoElement).toBeInTheDocument();
    });
  });

  describe('7. Barcode Scanner - Valid Barcode', () => {
    test('should detect valid barcode and display patient info', async () => {
      const mockBarcodeResult = { text: 'IRON001' };
      
      renderWithRouter(<BarcodeScannerScreen />);

      // Mock successful barcode detection
      const mockReader = require('@zxing/library').BrowserMultiFormatReader;
      const mockInstance = mockReader.mock.instances[0];
      
      // Simulate barcode detection
      mockInstance.decodeFromVideoDevice.mockImplementation((deviceId, videoElement, callback) => {
        setTimeout(() => callback(mockBarcodeResult), 100);
      });

      await waitFor(() => {
        expect(screen.getByText(/patient info/i)).toBeInTheDocument();
      });

      // Check that patient information is displayed
      expect(screen.getByText(/iron supplement/i)).toBeInTheDocument();
    });
  });

  describe('8. Barcode Scanner - Invalid Barcode', () => {
    test('should show error message for invalid barcode', async () => {
      renderWithRouter(<BarcodeScannerScreen />);

      // Mock invalid barcode detection
      const mockReader = require('@zxing/library').BrowserMultiFormatReader;
      const mockInstance = mockReader.mock.instances[0];
      
      // Simulate invalid barcode error
      mockInstance.decodeFromVideoDevice.mockImplementation((deviceId, videoElement, callback, errorCallback) => {
        setTimeout(() => errorCallback(new Error('Invalid barcode')), 100);
      });

      await waitFor(() => {
        expect(screen.getByText(/invalid barcode/i)).toBeInTheDocument();
      });

      // Check that retry button is available
      const retryButton = screen.getByRole('button', { name: /retry scan/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('9. Barcode Scanner - Camera Permission Denied', () => {
    test('should show error message when camera permission is denied', async () => {
      // Mock camera permission denied
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

      renderWithRouter(<BarcodeScannerScreen />);

      await waitFor(() => {
        expect(screen.getByText(/camera permission denied/i)).toBeInTheDocument();
      });

      // Check that enable camera button is available
      const enableCameraButton = screen.getByRole('button', { name: /enable camera/i });
      expect(enableCameraButton).toBeInTheDocument();
    });
  });

  describe('10. Barcode Scanner - Multiple Camera Devices', () => {
    test('should handle multiple camera devices and select back camera by default', async () => {
      // Mock multiple cameras
      const mockEnumerateDevices = jest.fn().mockResolvedValue([
        { deviceId: 'back', label: 'Back Camera', kind: 'videoinput' },
        { deviceId: 'front', label: 'Front Camera', kind: 'videoinput' },
      ]);

      Object.defineProperty(navigator.mediaDevices, 'enumerateDevices', {
        value: mockEnumerateDevices,
        writable: true,
      });

      renderWithRouter(<BarcodeScannerScreen />);

      await waitFor(() => {
        expect(mockEnumerateDevices).toHaveBeenCalled();
      });

      // Check that camera selector is present
      const cameraSelector = screen.getByRole('combobox', { name: /camera/i });
      expect(cameraSelector).toBeInTheDocument();

      // Check that back camera is selected by default
      expect(cameraSelector).toHaveValue('back');
    });
  });
});
