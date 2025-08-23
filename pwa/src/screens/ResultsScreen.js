import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home, History, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const ResultsScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { record, patientInfo, aiResult } = location.state || {};

  if (!record) {
    navigate('/');
    return null;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getSourceLabel = (source) => {
    switch (source) {
      case 'ai':
        return 'AI Detection';
      case 'ai_with_manual_override':
        return 'AI + Manual Override';
      case 'manual':
        return 'Manual Count';
      default:
        return source;
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <h1 className="text-xl font-semibold text-gray-900">Count Results</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Count Submitted Successfully!
          </h2>
          <p className="text-gray-600">
            Your pill count has been recorded and saved
          </p>
        </div>

        {/* Results Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Count Summary
          </h3>
          
          <div className="space-y-4">
            {/* Patient Info */}
            {patientInfo && (
              <div className="border-b border-gray-200 pb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Patient</h4>
                <p className="text-lg text-gray-900">{patientInfo.patient_name}</p>
                {patientInfo.barcode_id && (
                  <p className="text-sm text-gray-600">Barcode: {patientInfo.barcode_id}</p>
                )}
              </div>
            )}

            {/* Pill Count */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Pill Count</h4>
              <div className="flex items-center">
                <span className="text-3xl font-bold text-green-600 mr-3">
                  {record.pill_count}
                </span>
                <span className="text-sm text-gray-600">pills</span>
              </div>
            </div>

            {/* AI Results */}
            {aiResult && (
              <div className="border-b border-gray-200 pb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">AI Analysis</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">AI Detected</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {aiResult.pill_count} pills
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Confidence</p>
                    <p className={`text-lg font-semibold ${getConfidenceColor(aiResult.confidence)}`}>
                      {Math.round(aiResult.confidence * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Count Method */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Count Method</h4>
              <p className="text-gray-900">{getSourceLabel(record.source)}</p>
            </div>

            {/* Timestamp */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recorded At</h4>
              <p className="text-gray-900">{formatDate(record.timestamp)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center"
          >
            <Home className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>

          <button
            onClick={() => navigate('/history')}
            className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center"
          >
            <History className="h-5 w-5 mr-2" />
            View History
          </button>

          <button
            onClick={() => navigate('/camera')}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center"
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            Count Another Bottle
          </button>
        </div>

        {/* Offline Notice */}
        {!navigator.onLine && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Working Offline
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Your count has been saved locally. It will sync to the server when you're back online.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsScreen;
