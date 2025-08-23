import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, RotateCcw, CheckCircle } from 'lucide-react';
import { apiService } from '../services/apiService';
import { offlineStorage } from '../services/offlineStorage';
import toast from 'react-hot-toast';

const CameraScreen = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [manualCount, setManualCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const patientInfo = location.state?.patientInfo;

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setAiResult(null);
        setManualCount('');
      } else {
        toast.error('Please select an image file');
      }
    }
  };



  const handleRetake = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setAiResult(null);
    setManualCount('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      toast.error('Please select an image first');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.countPills(selectedImage);
      setAiResult(result);
      setManualCount(result.pill_count.toString());
      toast.success('AI analysis completed!');
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage || !manualCount) {
      toast.error('Please provide an image and pill count');
      return;
    }

    setSubmitting(true);
    try {
      const record = {
        patient_id: patientInfo?.patient_id || null,
        supplement_id: patientInfo?.supplement_id || null,
        pill_count: parseInt(manualCount),
        source: aiResult ? 'ai_with_manual_override' : 'manual',
        confidence: aiResult?.confidence || null,
        image_file: selectedImage,
        timestamp: new Date().toISOString()
      };

      // Check if online
      if (navigator.onLine) {
        await apiService.submitCount(record);
        toast.success('Record submitted successfully!');
      } else {
        // Store offline
        await offlineStorage.storePendingRecord(record);
        toast.success('Record saved offline. Will sync when online.');
      }

      navigate('/results', { 
        state: { 
          record,
          patientInfo,
          aiResult 
        } 
      });
    } catch (error) {
      console.error('Error submitting record:', error);
      toast.error('Failed to submit record. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
            <h1 className="text-xl font-semibold text-gray-900">Count Pills</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Info */}
        {patientInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Patient Information</h3>
            <p className="text-blue-900">{patientInfo.patient_name}</p>
            <p className="text-sm text-blue-700">Barcode: {patientInfo.barcode_id}</p>
          </div>
        )}

        {/* Image Capture Section */}
        {!previewUrl && (
          <div className="text-center">
            <div className="mb-8">
              <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Camera className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Capture Pill Bottle
              </h2>
              <p className="text-gray-600">
                Take a clear photo of the pill bottle for AI-powered counting
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <Camera className="h-5 w-5 inline mr-2" />
                Take Photo
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <Upload className="h-5 w-5 inline mr-2" />
                Choose from Gallery
              </button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*;capture=camera"
              onChange={handleImageSelect}
              className="hidden"
              capture="environment"
            />
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Image Preview and Analysis */}
        {previewUrl && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Review Image
              </h2>
              <p className="text-gray-600">
                Check the image and proceed with AI analysis
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <img
                src={previewUrl}
                alt="Pill bottle"
                className="w-full rounded-lg"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleRetake}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <RotateCcw className="h-4 w-4 inline mr-2" />
                Retake
              </button>
              
              <button
                onClick={analyzeImage}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </div>
                ) : (
                  'Analyze with AI'
                )}
              </button>
            </div>

            {/* AI Results */}
            {aiResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <h3 className="text-lg font-semibold text-green-800">
                    AI Analysis Complete
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700">Detected Pills</label>
                    <p className="text-2xl font-bold text-green-900">{aiResult.pill_count}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700">Confidence</label>
                    <p className="text-lg font-semibold text-green-900">
                      {Math.round(aiResult.confidence * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Count Input */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Final Pill Count
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="pillCount" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Pills
                  </label>
                  <input
                    type="number"
                    id="pillCount"
                    value={manualCount}
                    onChange={(e) => setManualCount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter pill count"
                    min="0"
                  />
                </div>
                
                <button
                  onClick={handleSubmit}
                  disabled={!manualCount || submitting}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    'Submit Count'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraScreen;
