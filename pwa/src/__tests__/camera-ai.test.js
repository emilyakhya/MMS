import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CameraScreen from '../screens/CameraScreen';

// Mock the API service
jest.mock('../services/apiService', () => ({
  analyzeImage: jest.fn(),
  submitRecord: jest.fn(),
}));

// Mock file input
const mockFile = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Camera and AI Analysis Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('11. Photo Capture - Camera Access', () => {
    test('should access camera when take photo button is clicked', async () => {
      renderWithRouter(<CameraScreen />);

      const takePhotoButton = screen.getByRole('button', { name: /take photo/i });
      expect(takePhotoButton).toBeInTheDocument();

      // Mock camera access
      const mockGetUserMedia = jest.fn().mockResolvedValue({
        getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
      });

      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
        value: mockGetUserMedia,
        writable: true,
      });

      fireEvent.click(takePhotoButton);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({ video: true });
      });
    });
  });

  describe('12. Photo Capture - Gallery Selection', () => {
    test('should allow photo selection from gallery', async () => {
      renderWithRouter(<CameraScreen />);

      const galleryButton = screen.getByRole('button', { name: /choose from gallery/i });
      expect(galleryButton).toBeInTheDocument();

      // Mock file input
      const fileInput = screen.getByTestId('file-input');
      
      // Simulate file selection
      fireEvent.change(fileInput, {
        target: { files: [mockFile] }
      });

      await waitFor(() => {
        expect(screen.getByAltText(/preview/i)).toBeInTheDocument();
      });
    });
  });

  describe('13. AI Analysis - Valid Pill Bottle Image', () => {
    test('should analyze pill bottle image and display results', async () => {
      const mockAnalysisResult = {
        pill_count: 25,
        confidence: 0.85,
        success: true
      };

      const { analyzeImage } = require('../services/apiService');
      analyzeImage.mockResolvedValue(mockAnalysisResult);

      renderWithRouter(<CameraScreen />);

      // Upload test image
      const fileInput = screen.getByTestId('file-input');
      fireEvent.change(fileInput, {
        target: { files: [mockFile] }
      });

      await waitFor(() => {
        expect(screen.getByAltText(/preview/i)).toBeInTheDocument();
      });

      // Click analyze button
      const analyzeButton = screen.getByRole('button', { name: /analyze with AI/i });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(analyzeImage).toHaveBeenCalled();
      });

      // Check that results are displayed
      await waitFor(() => {
        expect(screen.getByText(/25/i)).toBeInTheDocument(); // pill count
        expect(screen.getByText(/85%/i)).toBeInTheDocument(); // confidence
      });
    });
  });

  describe('14. AI Analysis - Poor Quality Image', () => {
    test('should show low confidence for poor quality image', async () => {
      const mockAnalysisResult = {
        pill_count: 10,
        confidence: 0.45, // Low confidence
        success: true
      };

      const { analyzeImage } = require('../services/apiService');
      analyzeImage.mockResolvedValue(mockAnalysisResult);

      renderWithRouter(<CameraScreen />);

      // Upload test image
      const fileInput = screen.getByTestId('file-input');
      fireEvent.change(fileInput, {
        target: { files: [mockFile] }
      });

      // Click analyze button
      const analyzeButton = screen.getByRole('button', { name: /analyze with AI/i });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/45%/i)).toBeInTheDocument(); // Low confidence
      });

      // Check that retake button is available for low confidence
      const retakeButton = screen.getByRole('button', { name: /retake photo/i });
      expect(retakeButton).toBeInTheDocument();
    });
  });

  describe('15. Manual Count Override', () => {
    test('should allow manual count override and submit with correct source', async () => {
      const mockAnalysisResult = {
        pill_count: 20,
        confidence: 0.75,
        success: true
      };

      const { analyzeImage, submitRecord } = require('../services/apiService');
      analyzeImage.mockResolvedValue(mockAnalysisResult);
      submitRecord.mockResolvedValue({ success: true });

      renderWithRouter(<CameraScreen />);

      // Upload and analyze image
      const fileInput = screen.getByTestId('file-input');
      fireEvent.change(fileInput, {
        target: { files: [mockFile] }
      });

      const analyzeButton = screen.getByRole('button', { name: /analyze with AI/i });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/20/i)).toBeInTheDocument();
      });

      // Modify manual count
      const manualCountInput = screen.getByLabelText(/manual count/i);
      fireEvent.change(manualCountInput, {
        target: { value: '25' }
      });

      // Submit count
      const submitButton = screen.getByRole('button', { name: /submit count/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitRecord).toHaveBeenCalledWith(
          expect.objectContaining({
            pill_count: 25,
            source: 'ai_with_manual_override'
          })
        );
      });
    });
  });
});
