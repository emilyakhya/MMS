import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/library';
import { ArrowLeft, QrCode, AlertCircle, CheckCircle } from 'lucide-react';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

const BarcodeScannerScreen = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const codeReader = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize barcode reader
    codeReader.current = new BrowserMultiFormatReader();
    
    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera access is not supported in this browser');
      return;
    }

    try {
      setScanning(true);
      setError(null);
      setResult(null);

      const videoInputDevices = await codeReader.current.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        setError('No camera found on this device');
        setScanning(false);
        return;
      }

      // Use the first available camera (usually the back camera on mobile)
      const selectedDeviceId = videoInputDevices[0].deviceId;

      await codeReader.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            handleScanResult(result.text);
          }
          if (error && error.name !== 'NotFoundException') {
            console.error('Scanning error:', error);
          }
        }
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Failed to start camera. Please check permissions.');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setScanning(false);
  };

  const handleScanResult = async (barcode) => {
    stopScanning();
    setLoading(true);

    try {
      const response = await apiService.scanBarcode(barcode);
      setResult(response);
      toast.success('Barcode scanned successfully!');
    } catch (error) {
      console.error('Error scanning barcode:', error);
      setError('Failed to process barcode. Please try again.');
      toast.error('Barcode scan failed');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (result) {
      // Navigate to camera screen with patient info
      navigate('/camera', { 
        state: { 
          patientInfo: result,
          barcode: result.barcode_id 
        } 
      });
    }
  };

  const handleManualEntry = () => {
    navigate('/camera');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={() => navigate('/')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Scan Barcode</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!scanning && !result && (
          <div className="text-center">
            <div className="mb-8">
              <div className="mx-auto h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <QrCode className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Scan Supplement Barcode
              </h2>
              <p className="text-gray-600">
                Point your camera at the supplement barcode to identify the patient
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={startScanning}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Start Scanning
              </button>
              
              <button
                onClick={handleManualEntry}
                className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Skip Barcode (Manual Entry)
              </button>
            </div>
          </div>
        )}

        {scanning && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Scanning...
              </h2>
              <p className="text-gray-600">
                Position the barcode within the camera view
              </p>
            </div>

            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-lg border-2 border-blue-500"
                style={{ maxHeight: '400px' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-white rounded-lg p-2">
                  <div className="w-48 h-32 border-2 border-blue-500 rounded"></div>
                </div>
              </div>
            </div>

            <button
              onClick={stopScanning}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Stop Scanning
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing barcode...</p>
          </div>
        )}

        {result && !loading && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Barcode Scanned Successfully
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient Name</label>
                <p className="text-lg text-gray-900">{result.patient_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Barcode ID</label>
                <p className="text-sm text-gray-600 font-mono">{result.barcode_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplement ID</label>
                <p className="text-sm text-gray-600">{result.supplement_id}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Continue to Pill Counting
              </button>
              
              <button
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
                className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Scan Another Barcode
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeScannerScreen;
