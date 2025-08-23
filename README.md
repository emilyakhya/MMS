# MMS - AI-Powered Pill Counting PWA System

A Progressive Web App (PWA) for Community Health Promoters (CHPs) to count pills using AI-powered computer vision, with offline support and real-time synchronization.

## 🚀 Features

### PWA (Progressive Web App)
- **Cross-platform**: Works on Chrome desktop and mobile without installation
- **Offline-first**: Service workers + IndexedDB for offline data storage
- **Camera Integration**: Native camera access for pill bottle photos
- **Barcode Scanning**: Web-based barcode scanning using zxing-js
- **AI-Powered Counting**: YOLOv8 model for automatic pill detection
- **Manual Override**: CHPs can adjust AI counts before submission
- **Real-time Sync**: Automatic data synchronization when online

### Admin Dashboard
- **Aggregated Records**: View all pill count records
- **Advanced Filtering**: Filter by date range, CHP, patient
- **Data Export**: Export to CSV/Excel format
- **Visual Analytics**: Patient adherence patterns and trends
- **Real-time Updates**: Live data updates from PWA submissions

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PWA Frontend  │    │  Admin Dashboard │    │  FastAPI Backend │
│   (React)       │    │   (React)       │    │   (Python)      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Service Worker│    │ • Material-UI   │    │ • YOLOv8 Model  │
│ • IndexedDB     │    │ • Recharts      │    │ • SQLite DB     │
│ • Camera API    │    │ • Data Export   │    │ • JWT Auth      │
│ • Barcode Scan  │    │ • Analytics     │    │ • CORS Support  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   SQLite DB     │
                    │   (Local)       │
                    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend (PWA)
- **React 18** - UI framework
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **zxing-js** - Barcode scanning
- **IndexedDB** - Offline storage
- **Service Workers** - Offline functionality
- **Axios** - HTTP client

### Frontend (Dashboard)
- **React 18** - UI framework
- **Material-UI** - Component library
- **Recharts** - Data visualization
- **React Router** - Navigation
- **Axios** - HTTP client

### Backend
- **FastAPI** - API framework
- **SQLAlchemy** - ORM
- **SQLite** - Database
- **YOLOv8** - Computer vision model
- **JWT** - Authentication
- **Pillow** - Image processing

## 📱 PWA Features

### User Authentication
- Simple login flow for CHPs
- JWT token-based authentication
- Automatic token refresh
- Secure session management

### Barcode Scanning
- Real-time camera barcode detection
- Support for multiple barcode formats
- Automatic patient/supplement lookup
- Error handling and retry logic

### Photo Capture
- Native camera access via `<input type="file" accept="image/*;capture=camera">`
- Gallery selection option
- Image preview and validation
- Automatic image optimization

### AI-Powered Counting
- YOLOv8 model integration
- Real-time pill detection
- Confidence scoring
- Bounding box visualization
- Manual count override

### Offline Support
- Service worker caching
- IndexedDB for local storage
- Automatic sync when online
- Conflict resolution
- Data integrity checks

## 🎯 User Workflow

### CHP Workflow
1. **Login** - Authenticate with email/password
2. **Scan Barcode** - Scan pill bottle barcode
3. **Capture Photo** - Take photo of pill bottle
4. **AI Analysis** - Automatic pill counting
5. **Manual Override** - Adjust count if needed
6. **Submit** - Save record (online/offline)
7. **Sync** - Automatic data synchronization

### Admin Workflow
1. **Dashboard** - View aggregated statistics
2. **Records** - Browse all pill count records
3. **Filter** - Apply date/patient/CHP filters
4. **Export** - Download data as CSV/Excel
5. **Analytics** - View adherence patterns

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- Python 3.8+
- Chrome browser (for PWA testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/emilyakhya/MMS.git
   cd MMS
   ```

2. **Setup Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python init_db.py
   python main.py
   ```

3. **Setup PWA**
   ```bash
   cd pwa
   npm install
   npm start
   ```

4. **Setup Dashboard**
   ```bash
   cd dashboard
   npm install
   npm start
   ```

### Development URLs
- **PWA**: http://localhost:3000
- **Dashboard**: http://localhost:3001
- **Backend API**: http://localhost:8000

## 🧪 Testing

### Test Structure
The project includes comprehensive testing across multiple layers:

```
├── tests/
│   ├── backend/                 # Backend unit and integration tests
│   │   ├── test_main.py        # API endpoint tests
│   │   ├── test_models.py      # Database model tests
│   │   ├── test_auth_service.py # Authentication service tests
│   │   └── test_pill_detection_service.py # AI service tests
│   └── e2e/                    # End-to-end tests
├── pwa/
│   ├── src/__tests__/          # PWA unit tests
│   │   ├── auth.test.js        # Authentication tests
│   │   ├── barcode-scanner.test.js # Barcode scanning tests
│   │   ├── camera-ai.test.js   # Camera and AI tests
│   │   ├── offline-functionality.test.js # Offline functionality tests
│   │   └── pwa-installation.test.js # PWA installation tests
│   └── tests/e2e/              # PWA E2E tests
│       ├── auth.spec.js        # Authentication E2E tests
│       ├── barcode-scanner.spec.js # Barcode scanning E2E tests
│       └── camera-ai.spec.js   # Camera and AI E2E tests
└── .github/workflows/          # CI/CD pipeline
    └── test.yml               # GitHub Actions test workflow
```

### Running Tests

#### Backend Tests
```bash
cd backend

# Run all tests with coverage
pytest --cov=backend --cov-report=html --cov-report=term-missing

# Run specific test categories
pytest -m unit          # Unit tests only
pytest -m integration   # Integration tests only
pytest -m auth          # Authentication tests only
pytest -m ai            # AI model tests only

# Run tests with verbose output
pytest -v

# Run tests in parallel
pytest -n auto
```

#### PWA Unit Tests
```bash
cd pwa

# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with specific pattern
npm test -- --testNamePattern="auth"

# Run tests with coverage report
npm test -- --coverage --watchAll=false
```

#### E2E Tests
```bash
cd pwa

# Install Playwright browsers (first time only)
npx playwright install --with-deps

# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific E2E test file
npx playwright test tests/e2e/auth.spec.js

# Run E2E tests in headed mode
npx playwright test --headed
```

#### Dashboard Tests
```bash
cd dashboard

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage --watchAll=false
```

### Test Coverage Requirements

The project enforces minimum coverage thresholds:

- **Backend**: 80% coverage (branches, functions, lines, statements)
- **PWA**: 80% coverage (branches, functions, lines, statements)
- **Dashboard**: 80% coverage (branches, functions, lines, statements)

### Test Data

#### User Accounts for Testing
- **CHP 1**: `chp1@mms.org` / `password123`
- **CHP 2**: `chp2@mms.org` / `password123`
- **Admin**: `admin@mms.org` / `password123`

#### Test Barcodes
- **Valid**: `IRON001`, `FOLIC001`, `IRON002`, `FOLIC002`
- **Invalid**: `INVALID001`, `TEST123`

#### Test Images
- Clear pill bottle photos
- Blurry/unclear images
- Non-pill bottle images
- Various lighting conditions

### Performance Testing

#### Load Time Benchmarks
- **First Load**: <5 seconds
- **Cached Load**: <2 seconds
- **AI Processing**: <10 seconds
- **Offline Sync**: Automatic

#### Performance Tests
```bash
cd pwa

# Run performance tests
npx playwright test tests/e2e/performance.spec.js

# Run Lighthouse CI
npm run lighthouse
```

### Security Testing

#### Backend Security
```bash
cd backend

# Run security scans
bandit -r . -f json -o bandit-report.json
safety check --json --output safety-report.json

# Run dependency vulnerability scan
pip-audit
```

#### Frontend Security
```bash
cd pwa

# Run npm audit
npm audit

# Run security audit with fix
npm audit fix
```

### Continuous Integration

The project uses GitHub Actions for automated testing:

- **Triggers**: Push to main/develop, Pull Requests
- **Test Matrix**: Python 3.9, 3.10, 3.11
- **Coverage Reports**: Uploaded to Codecov
- **Artifacts**: Test results and reports stored for 30 days

#### CI Pipeline Jobs
1. **Backend Tests** - Unit and integration tests
2. **Frontend Tests** - PWA unit tests
3. **E2E Tests** - End-to-end testing
4. **Dashboard Tests** - Admin dashboard tests
5. **Integration Tests** - Full system integration
6. **Performance Tests** - Performance benchmarks
7. **Security Tests** - Security vulnerability scans

### Manual Testing Checklist

#### Authentication & User Management
- [ ] Valid login credentials
- [ ] Invalid login credentials
- [ ] Password visibility toggle
- [ ] Session expiration
- [ ] Logout functionality

#### Barcode Scanning
- [ ] Camera access permissions
- [ ] Valid barcode detection
- [ ] Invalid barcode handling
- [ ] Multiple camera devices
- [ ] Manual barcode entry

#### Photo Capture & AI Analysis
- [ ] Camera access
- [ ] Gallery selection
- [ ] AI analysis with valid images
- [ ] AI analysis with poor quality images
- [ ] Manual count override

#### Offline Functionality
- [ ] Offline record storage
- [ ] Online synchronization
- [ ] Offline app functionality
- [ ] Service worker caching
- [ ] Conflict resolution

#### Admin Dashboard
- [ ] Dashboard data loading
- [ ] Data filtering
- [ ] Data export
- [ ] Analytics visualization
- [ ] Real-time updates

#### PWA Installation & Performance
- [ ] Desktop installation
- [ ] Mobile installation
- [ ] First load performance
- [ ] Cached load performance
- [ ] Cross-browser compatibility

### Debugging Tests

#### Backend Test Debugging
```bash
# Run tests with debug output
pytest -v -s --tb=long

# Run specific test with debugger
pytest -s --pdb test_main.py::TestMainAPI::test_login_valid_credentials

# Run tests with coverage and show missing lines
pytest --cov=backend --cov-report=term-missing --cov-report=html
```

#### Frontend Test Debugging
```bash
# Run tests with debug output
npm test -- --verbose

# Run tests in debug mode
npm test -- --debug

# Run tests with specific environment
NODE_ENV=test npm test
```

#### E2E Test Debugging
```bash
# Run tests in headed mode
npx playwright test --headed

# Run tests with slow motion
npx playwright test --headed --slow-mo=1000

# Run tests with trace
npx playwright test --trace on

# Show test report
npx playwright show-report
```

## 📱 PWA Installation

### Desktop Chrome
1. Open the PWA in Chrome
2. Click the install icon in the address bar
3. Follow the installation prompts

### Mobile Chrome
1. Open the PWA in Chrome mobile
2. Tap the menu (⋮) and select "Add to Home Screen"
3. The PWA will be installed as a native app

## 🔧 Configuration

### Environment Variables

**PWA (.env)**
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development
```

**Backend (.env)**
```env
DATABASE_URL=sqlite:///./mms_pill_counting.db
SECRET_KEY=your-secret-key
MODEL_PATH=./yolov8n.pt
```

### Database Setup
The system uses SQLite with the following tables:
- `users` - CHP user accounts
- `patients` - Patient information
- `supplements` - Supplement/barcode mapping
- `records` - Pill count records

## 📊 Performance

### PWA Performance
- **First Load**: ~2-3 seconds (cached assets)
- **Subsequent Loads**: ~1 second (service worker cache)
- **Offline Mode**: Instant (IndexedDB)
- **Image Processing**: ~3-5 seconds (AI model)

### Backend Performance
- **API Response**: <500ms (average)
- **AI Processing**: 2-4 seconds per image
- **Database Queries**: <100ms (indexed)

## 🔒 Security

### Authentication
- JWT tokens with expiration
- Secure password hashing
- CORS configuration
- Input validation

### Data Protection
- HTTPS enforcement (production)
- SQL injection prevention
- XSS protection
- CSRF protection

## 🚀 Deployment

### Production Setup
1. **Backend**: Deploy FastAPI to cloud (AWS/GCP/Azure)
2. **PWA**: Build and deploy to CDN
3. **Database**: Use production database (PostgreSQL)
4. **SSL**: Enable HTTPS for all endpoints

### Build Commands
```bash
# PWA
cd pwa
npm run build

# Dashboard
cd dashboard
npm run build

# Backend
cd backend
pip install -r requirements.txt
```

## 📈 Monitoring

### Health Checks
- API endpoint monitoring
- Database connectivity
- AI model performance
- PWA service worker status

### Analytics
- User engagement metrics
- Pill counting accuracy
- Offline usage patterns
- Error tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Development Guidelines
- Write tests for all new features
- Maintain 80% code coverage
- Follow the existing code style
- Update documentation as needed
- Run the full test suite before submitting

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

## 🔮 Future Enhancements

- **Push Notifications**: Real-time alerts for CHPs
- **Multi-language Support**: Localization for different regions
- **Advanced Analytics**: Machine learning insights
- **Mobile App**: Native iOS/Android apps
- **Cloud Storage**: Image backup and sharing
- **Integration**: EHR system integration
