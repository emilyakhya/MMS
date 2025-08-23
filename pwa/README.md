# MMS - Pill Counter PWA

A Progressive Web App (PWA) for AI-powered pill counting designed for Community Health Promoters (CHPs) working with pregnant women.

## Features

### 🔐 Authentication
- Simple login system for CHPs
- Secure token-based authentication
- Automatic session management

### 📱 PWA Capabilities
- **Installable**: Add to home screen on mobile and desktop
- **Offline-first**: Works without internet connection
- **Responsive**: Optimized for mobile and desktop
- **Fast**: Cached resources for quick loading

### 📷 Barcode Scanning
- Web-based barcode scanner using device camera
- Supports multiple barcode formats
- Automatic patient identification
- Manual entry option available

### 🤖 AI-Powered Pill Counting
- Photo capture via device camera
- YOLOv8-based pill detection
- Confidence scoring
- Manual override capability
- Real-time analysis

### 📊 Data Management
- Local storage with IndexedDB
- Automatic sync when online
- Export functionality (CSV)
- Search and filter capabilities
- Patient history tracking

## Tech Stack

- **Frontend**: React 18, Tailwind CSS
- **PWA**: Service Workers, IndexedDB
- **Barcode Scanning**: zxing-js
- **Backend**: FastAPI (separate service)
- **AI Model**: YOLOv8
- **Database**: SQLite

## Setup Instructions

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend API running (see backend README)

### Installation

1. **Clone the repository**
   ```bash
   cd pwa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   Create a `.env` file in the pwa directory:
   ```env
   REACT_APP_API_URL=http://localhost:8000
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Serve production build**
   ```bash
   npm run serve
   ```

## Usage

### For CHPs

1. **Login**: Use provided credentials to access the system
2. **Scan Barcode**: Point camera at supplement barcode to identify patient
3. **Take Photo**: Capture clear image of pill bottle
4. **Review AI Count**: Check AI-detected count and confidence
5. **Manual Adjust**: Override AI count if needed
6. **Submit**: Save the count to the system
7. **View History**: Access past records and export data

### Offline Mode

- App works without internet connection
- Data is stored locally using IndexedDB
- Automatic sync when connection is restored
- Visual indicators show offline status

### PWA Installation

#### Mobile (Chrome/Edge)
1. Open the app in Chrome/Edge
2. Tap the menu (⋮) and select "Add to Home Screen"
3. Follow the prompts to install

#### Desktop (Chrome/Edge)
1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Follow the prompts to install

## API Integration

The PWA communicates with the FastAPI backend for:
- User authentication
- Barcode scanning
- AI pill detection
- Data storage and retrieval
- Export functionality

### API Endpoints Used
- `POST /login` - User authentication
- `POST /scan` - Barcode scanning
- `POST /upload` - Image upload for AI analysis
- `POST /submit` - Submit pill count
- `GET /records` - Get count history
- `GET /export/csv` - Export data

## Development

### Project Structure
```
pwa/
├── public/
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
├── src/
│   ├── components/
│   ├── screens/
│   ├── services/
│   ├── context/
│   └── utils/
└── package.json
```

### Key Components

- **AuthContext**: Manages user authentication state
- **OfflineStorage**: Handles local data storage
- **SyncService**: Manages offline/online data sync
- **ApiService**: Handles API communication

### Adding New Features

1. Create new screen components in `src/screens/`
2. Add routes in `src/App.js`
3. Update API service if needed
4. Test offline functionality
5. Update PWA manifest if adding new capabilities

## Testing

### Manual Testing Checklist

- [ ] Login/logout functionality
- [ ] Barcode scanning (with and without camera)
- [ ] Photo capture and AI analysis
- [ ] Manual count override
- [ ] Offline mode (disable network)
- [ ] Data sync when coming back online
- [ ] PWA installation
- [ ] Export functionality
- [ ] Search and filter in history

### Browser Testing

Test in the following browsers:
- Chrome (desktop & mobile)
- Edge (desktop & mobile)
- Safari (iOS)
- Firefox (desktop)

## Deployment

### Production Build
```bash
npm run build
```

### Serving with HTTPS
PWA features require HTTPS in production. Use a service like:
- Netlify
- Vercel
- Firebase Hosting
- AWS S3 + CloudFront

### Environment Variables
Set `REACT_APP_API_URL` to your production API endpoint.

## Troubleshooting

### Common Issues

1. **Camera not working**
   - Ensure HTTPS in production
   - Check browser permissions
   - Try different browser

2. **PWA not installing**
   - Verify manifest.json is valid
   - Check service worker registration
   - Ensure HTTPS in production

3. **Offline sync not working**
   - Check IndexedDB support
   - Verify service worker is active
   - Check browser console for errors

4. **AI analysis failing**
   - Verify backend is running
   - Check image format and size
   - Review API endpoint configuration

## Support

For technical support or feature requests, please contact the development team.

## License

This project is proprietary software developed for Community Health Promoters.
