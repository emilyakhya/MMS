import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import BarcodeScannerScreen from './screens/BarcodeScannerScreen';
import CameraScreen from './screens/CameraScreen';
import ResultsScreen from './screens/ResultsScreen';
import HistoryScreen from './screens/HistoryScreen';
import PrivateRoute from './components/PrivateRoute';
import './services/syncService'; // Initialize sync service
import './index.css';

function App() {
  useEffect(() => {
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="App min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/" element={<PrivateRoute><DashboardScreen /></PrivateRoute>} />
            <Route path="/scanner" element={<PrivateRoute><BarcodeScannerScreen /></PrivateRoute>} />
            <Route path="/camera" element={<PrivateRoute><CameraScreen /></PrivateRoute>} />
            <Route path="/results" element={<PrivateRoute><ResultsScreen /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute><HistoryScreen /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
