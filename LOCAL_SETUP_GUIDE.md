# Local Setup Guide for MMS Pill Counting System

This guide will help you run the complete MMS Pill Counting System locally on Google Chrome.

## System Overview

The system consists of three main components:
- **Backend API** (FastAPI + Python) - AI-powered pill detection and data management
- **PWA Frontend** (React) - Mobile/desktop app for pill counting
- **Dashboard** (React) - Admin interface for data visualization

## Prerequisites

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Python** (3.9 or higher) - [Download here](https://www.python.org/)
- **Google Chrome** - [Download here](https://www.google.com/chrome/)
- **Git** (optional) - [Download here](https://git-scm.com/)

### Verify Prerequisites

```bash
# Check Python version
python3 --version  # Should be 3.9 or higher

# Check Node.js version
node --version     # Should be 16 or higher

# Check npm version
npm --version      # Should be 6 or higher
```

## Quick Start (Recommended)

The easiest way to start the system is using the automated startup script:

```bash
# Make sure you're in the project root directory
cd /Users/admin/MMS

# Run the startup script
./start_local.sh
```

This script will automatically:
- ✅ Check and install all dependencies
- ✅ Start the backend API server (port 8000)
- ✅ Start the PWA frontend (port 3000)
- ✅ Start the dashboard (port 3001)
- ✅ Initialize the database
- ✅ Handle process management and cleanup

## Manual Setup (Alternative)

If you prefer to start services manually or need to debug specific components:

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# or
# venv\Scripts\activate  # On Windows

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Initialize the database with sample data
python init_db.py

# Start the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: **http://localhost:8000**
API documentation: **http://localhost:8000/docs**

### Step 2: PWA Frontend Setup

```bash
# Open a new terminal window
# Navigate to the PWA directory
cd pwa

# Install Node.js dependencies
npm install

# Start the React development server
npm start
```

The PWA will be available at: **http://localhost:3000**

### Step 3: Dashboard Setup

```bash
# Open another new terminal window
# Navigate to the dashboard directory
cd dashboard

# Install Node.js dependencies
npm install

# Start the React development server
npm start
```

The Dashboard will be available at: **http://localhost:3001**

## Access in Google Chrome

### Open the Applications

1. **Open Google Chrome**
2. **PWA Application**: Navigate to `http://localhost:3000`
   - This is the main pill counting application
   - You can use camera features and barcode scanning
   - Works best in full-screen mode

3. **Dashboard**: Navigate to `http://localhost:3001`
   - This is the admin dashboard for data visualization
   - View analytics and patient records

4. **API Documentation**: Navigate to `http://localhost:8000/docs`
   - Interactive API documentation
   - Test endpoints directly

### Chrome Developer Tools Setup

For the best development experience:

1. **Open Developer Tools**: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
2. **Device Simulation**: Click the device icon to test mobile responsiveness
3. **Console**: Monitor logs and debug issues
4. **Network Tab**: Monitor API calls between frontend and backend
5. **Application Tab**: Check service worker status for PWA features

### Chrome-Specific Features

1. **Camera Permissions**: Allow camera access when prompted for pill detection
2. **Location Services**: Enable if using location-based features
3. **Notifications**: Allow notifications for PWA features
4. **Full Screen**: Press `F11` for immersive experience
5. **Mobile Simulation**: Use device toolbar in DevTools for mobile testing

## Testing the System

### Test User Credentials

The system comes with pre-configured test users:

```
Email: chp1@mms.org
Password: password123
```

### Test Features

1. **Login**: Use the test credentials above
2. **Camera Access**: Allow camera permissions for pill detection
3. **Barcode Scanning**: Test with sample barcodes
4. **Pill Counting**: Upload pill bottle images for AI analysis
5. **Dashboard**: View analytics and patient data

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill processes using specific ports
lsof -ti:8000 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # PWA
lsof -ti:3001 | xargs kill -9  # Dashboard
```

#### 2. Node Modules Issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 3. Python Virtual Environment Issues
```bash
# Recreate virtual environment
deactivate
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 4. Database Issues
```bash
# Reinitialize database
cd backend
python init_db.py
```

#### 5. Permission Issues
```bash
# Make startup script executable
chmod +x start_local.sh
```

### Chrome-Specific Issues

#### 1. Camera Access Denied
- Click the camera icon in the address bar
- Select "Allow" for camera permissions
- Refresh the page if needed

#### 2. CORS Errors
- Check browser console for CORS errors
- Ensure backend is running on port 8000
- Verify CORS middleware is properly configured

#### 3. Service Worker Issues
- Open Chrome DevTools → Application → Service Workers
- Click "Unregister" and refresh the page
- Clear site data: Settings → Privacy → Clear browsing data

#### 4. PWA Not Installing
- Ensure HTTPS in production (localhost works for development)
- Check manifest.json configuration
- Verify service worker registration

#### 5. Mobile Simulation Issues
- Use Chrome DevTools device toolbar
- Test different device sizes
- Check responsive design breakpoints

### Performance Issues

#### 1. Slow Loading
- Check network tab in DevTools
- Verify all services are running
- Clear browser cache

#### 2. Memory Issues
- Monitor memory usage in DevTools
- Restart services if needed
- Check for memory leaks in console

## Development Workflow

### Recommended Terminal Setup

Use a terminal multiplexer like `tmux` or multiple terminal windows:

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: PWA
cd pwa
npm start

# Terminal 3: Dashboard
cd dashboard
npm start
```

### File Watching

All servers run with hot-reload enabled, so changes will automatically refresh in Chrome.

### Debugging Tips

1. **Backend Debugging**: Check terminal output for Python errors
2. **Frontend Debugging**: Use Chrome DevTools console and network tabs
3. **API Testing**: Use the interactive docs at `http://localhost:8000/docs`
4. **Database**: Check SQLite database file in backend directory

## Production Considerations

For production deployment:

1. **Environment Variables**: Set proper environment variables
2. **HTTPS**: Enable HTTPS for camera access and PWA features
3. **Database**: Use a production database (PostgreSQL, MySQL)
4. **Static Files**: Build and serve static files
5. **Security**: Configure CORS properly
6. **Performance**: Optimize images and assets
7. **Monitoring**: Set up logging and monitoring

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify all services are running on correct ports
3. Ensure all dependencies are installed
4. Check the API documentation at `http://localhost:8000/docs`
5. Review the troubleshooting section above

## Quick Commands Reference

```bash
# Start everything
./start_local.sh

# Stop everything
Ctrl+C (in the terminal running the script)

# Check if ports are in use
lsof -i :8000
lsof -i :3000
lsof -i :3001

# Kill processes on ports
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9

# Reinstall dependencies
cd backend && pip install -r requirements.txt
cd ../pwa && npm install
cd ../dashboard && npm install
```

The system is now ready to use locally on Google Chrome! 🚀
