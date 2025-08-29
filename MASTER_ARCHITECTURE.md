# System Architecture Document
## AI-Powered Pill Counting PWA System

**Document Version:** 1.0  
**Date:** December 2024  
**Project:** MMS Pill Counting System  
**Status:** Approved  

---

## 📋 Executive Summary

The MMS Pill Counting System is a comprehensive digital solution built with a modern, scalable architecture that leverages progressive web app technology, artificial intelligence, and cloud-native principles. The system is designed to provide accurate, efficient, and offline-capable pill counting capabilities for Community Health Promoters (CHPs) while maintaining enterprise-grade security and performance standards.

---

## 🏗️ High-Level Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              User Interface Layer                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  PWA (React)                    │  Admin Dashboard (React)                 │
│  • Service Workers              │  • Material-UI Components               │
│  • IndexedDB                    │  • Recharts Visualization               │
│  • Camera API                   │  • Data Export                          │
│  • Barcode Scanner              │  • Analytics Engine                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌────────────────┼────────────────┐
                    │                │                │
         ┌──────────▼─────────┐ ┌───▼───┐ ┌──────────▼─────────┐
         │   API Gateway      │ │ CORS  │ │   Authentication   │
         │   (FastAPI)        │ │Middleware│   (JWT)           │
         └────────────────────┘ └───────┘ └────────────────────┘
                    │
         ┌──────────▼─────────┐
         │   Business Logic   │
         │   Layer            │
         ├────────────────────┤
         │ • Auth Service     │
         │ • Pill Detection   │
         │ • Data Management  │
         │ • Sync Service     │
         └────────────────────┘
                    │
         ┌──────────▼─────────┐
         │   Data Layer       │
         ├────────────────────┤
         │ • SQLAlchemy ORM   │
         │ • SQLite (Dev)     │
         │ • PostgreSQL (Prod)│
         │ • IndexedDB (PWA)  │
         └────────────────────┘
```

### Component Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Frontend Applications                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Progressive Web App (PWA)                       │   │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐   │   │
│  │  │   Auth Module   │ │  Camera Module  │ │  Offline Module     │   │   │
│  │  │ • Login/Logout  │ │ • Photo Capture │ │ • Service Workers   │   │   │
│  │  │ • JWT Storage   │ │ • AI Analysis   │ │ • IndexedDB         │   │   │
│  │  │ • Route Guard   │ │ • Manual Override│ │ • Sync Queue        │   │   │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐   │   │
│  │  │ Barcode Module  │ │  History Module │ │   Results Module    │   │   │
│  │  │ • Camera Scan   │ │ • Local Records │ │ • Count Display     │   │   │
│  │  │ • Patient Lookup│ │ • Search/Filter │ │ • Override Input    │   │   │
│  │  │ • Error Handling│ │ • Export Data   │ │ • Submit Record     │   │   │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Admin Dashboard                                  │   │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐   │   │
│  │  │ Analytics Module│ │  Records Module │ │   Users Module      │   │   │
│  │  │ • Charts/Graphs │ │ • Data Table    │ │ • User Management   │   │   │
│  │  │ • KPIs          │ │ • Filtering     │ │ • Role Assignment   │   │   │
│  │  │ • Trends        │ │ • Export        │ │ • Access Control    │   │   │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌────────────────┼────────────────┐
                    │                │                │
         ┌──────────▼─────────┐ ┌───▼───┐ ┌──────────▼─────────┐
         │   API Gateway      │ │ CORS  │ │   Authentication   │
         │   (FastAPI)        │ │Middleware│   (JWT)           │
         └────────────────────┘ └───────┘ └────────────────────┘
                    │
         ┌──────────▼─────────┐
         │   Business Logic   │
         │   Layer            │
         ├────────────────────┤
         │ • Auth Service     │
         │ • Pill Detection   │
         │ • Data Management  │
         │ • Sync Service     │
         └────────────────────┘
                    │
         ┌──────────▼─────────┐
         │   Data Layer       │
         ├────────────────────┤
         │ • SQLAlchemy ORM   │
         │ • SQLite (Dev)     │
         │ • PostgreSQL (Prod)│
         │ • IndexedDB (PWA)  │
         └────────────────────┘
```

---

## 🔧 Technical Architecture

### Frontend Architecture

#### PWA (Progressive Web App)
**Technology Stack:**
- **Framework**: React 18 with React Router v6
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Context API + Local Storage
- **Offline Support**: Service Workers + IndexedDB
- **Build Tool**: Create React App with Workbox integration

**Key Components:**
```
src/
├── components/           # Reusable UI components
├── screens/             # Main application screens
│   ├── LoginScreen      # Authentication interface
│   ├── DashboardScreen  # Main navigation hub
│   ├── BarcodeScannerScreen # Barcode scanning interface
│   ├── CameraScreen     # Photo capture and AI analysis
│   ├── ResultsScreen    # Results display and submission
│   └── HistoryScreen    # Historical records view
├── services/            # Business logic and API integration
│   ├── apiService       # HTTP client and API calls
│   ├── offlineStorage   # IndexedDB operations
│   └── syncService      # Data synchronization
├── context/             # React Context providers
│   └── AuthContext      # Authentication state management
└── utils/               # Utility functions and helpers
```

**Service Worker Architecture:**
```
sw.js
├── Static Asset Caching    # CSS, JS, Images
├── Dynamic API Caching     # API responses
├── Navigation Caching      # Route caching
├── Background Sync         # Offline data sync
└── Push Notifications      # Future enhancement
```

#### Admin Dashboard
**Technology Stack:**
- **Framework**: React 18 with Material-UI v5
- **Charts**: Recharts for data visualization
- **Data Grid**: Material-UI X Data Grid
- **Date Handling**: date-fns library
- **HTTP Client**: Axios for API communication

**Key Components:**
```
src/
├── components/           # Dashboard components
│   ├── Dashboard        # Main dashboard view
│   ├── Analytics        # Charts and metrics
│   ├── RecordsTable     # Data table with filtering
│   └── Layout          # Navigation and layout
└── services/            # API integration services
```

### Backend Architecture

#### FastAPI Server
**Technology Stack:**
- **Framework**: FastAPI with Uvicorn ASGI server
- **Authentication**: JWT tokens with Python-Jose
- **Password Hashing**: Passlib with bcrypt
- **CORS**: FastAPI CORS middleware
- **Validation**: Pydantic models for request/response validation

**API Structure:**
```
/api/v1/
├── /auth                # Authentication endpoints
│   ├── POST /login      # User login
│   └── POST /logout     # User logout
├── /patients            # Patient management
│   ├── GET /            # List patients
│   ├── POST /           # Create patient
│   └── GET /{id}        # Get patient details
├── /supplements         # Supplement management
│   ├── GET /            # List supplements
│   ├── POST /           # Create supplement
│   └── GET /{id}        # Get supplement details
├── /records             # Pill count records
│   ├── GET /            # List records with filtering
│   ├── POST /           # Create record
│   └── GET /{id}        # Get record details
├── /upload              # Image upload and AI analysis
│   └── POST /           # Upload image for pill detection
├── /scan                # Barcode scanning
│   └── POST /           # Scan barcode for patient lookup
├── /export              # Data export
│   ├── GET /csv         # Export records as CSV
│   └── GET /excel       # Export records as Excel
└── /health              # Health check endpoint
```

#### Business Logic Layer
**Services Architecture:**
```
services/
├── auth_service.py       # Authentication and authorization
├── pill_detection_service.py # AI-powered pill detection
├── data_service.py       # Data management and CRUD operations
└── sync_service.py       # Data synchronization and conflict resolution
```

**Authentication Service:**
- JWT token generation and validation
- Password hashing and verification
- Role-based access control (CHP, Admin)
- Session management and expiration

**Pill Detection Service:**
- YOLOv8 model integration for computer vision
- Image preprocessing and validation
- Confidence scoring and bounding box detection
- Manual override capability

**Data Service:**
- CRUD operations for all entities
- Data validation and sanitization
- Audit logging and tracking
- Export functionality (CSV, Excel)

### Data Architecture

#### Database Design
**Entity Relationship Model:**
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Users     │    │   Patients   │    │ Supplements │
├─────────────┤    ├──────────────┤    ├─────────────┤
│ id (PK)     │    │ id (PK)      │    │ id (PK)     │
│ email       │    │ name         │    │ barcode_id  │
│ name        │    │ metadata     │    │ patient_id  │
│ password    │    │ created_at   │    │ supplement_type │
│ role        │    └──────────────┘    │ created_at  │
│ is_active   │           │            └─────────────┘
│ created_at  │           │                    │
└─────────────┘           │                    │
                          │                    │
                    ┌─────▼─────┐              │
                    │  Records  │              │
                    ├───────────┤              │
                    │ id (PK)   │              │
                    │ patient_id│              │
                    │ supplement_id │          │
                    │ pill_count│              │
                    │ source    │              │
                    │ confidence│              │
                    │ timestamp │              │
                    │ notes     │              │
                    └───────────┘              │
```

**Database Technologies:**
- **Development**: SQLite for local development
- **Production**: PostgreSQL for scalability and reliability
- **ORM**: SQLAlchemy 2.0 with async support
- **Migrations**: Alembic for schema versioning
- **Connection Pooling**: SQLAlchemy connection pooling

#### Offline Data Storage
**IndexedDB Schema:**
```
PillCounterDB (v1)
├── pendingRecords       # Offline pill count records
│   ├── id (PK)         # Auto-incrementing ID
│   ├── patient_id      # Patient identifier
│   ├── supplement_id   # Supplement identifier
│   ├── pill_count      # Number of pills
│   ├── source          # AI or manual count
│   ├── confidence      # AI confidence score
│   ├── timestamp       # Record creation time
│   └── synced          # Sync status flag
└── syncQueue           # Synchronization queue
    ├── id (PK)         # Auto-incrementing ID
    ├── type            # Queue item type
    ├── data            # Item data
    └── timestamp       # Queue timestamp
```

### AI/ML Architecture

#### Computer Vision Pipeline
**YOLOv8 Integration:**
```
Image Input → Preprocessing → YOLOv8 Model → Post-processing → Results
     │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼
Camera/Gallery → Image Validation → Model Inference → Confidence Scoring → Pill Count
```

**Model Specifications:**
- **Base Model**: YOLOv8n (nano) for speed optimization
- **Input Resolution**: 640x640 pixels (configurable)
- **Confidence Threshold**: 0.5 (configurable)
- **Detection Classes**: Generic object detection (MVP)
- **Future Enhancement**: Custom-trained pill detection model

**Processing Pipeline:**
1. **Image Validation**: File format, size, and quality checks
2. **Preprocessing**: Resize, normalize, and format conversion
3. **Model Inference**: YOLOv8 object detection
4. **Post-processing**: Filter detections, calculate confidence
5. **Result Formatting**: Pill count, confidence, bounding boxes

---

## 🔄 Data Flow Architecture

### Authentication Flow
```
User Login → Credential Validation → JWT Generation → Token Storage → API Access
     │              │                    │                │              │
     ▼              ▼                    ▼                ▼              ▼
Email/Password → Backend Auth → Access Token → Local Storage → Protected Routes
```

### Pill Counting Workflow
```
Barcode Scan → Patient Lookup → Photo Capture → AI Analysis → Manual Override → Record Submission
     │              │                │              │              │                │
     ▼              ▼                ▼              ▼              ▼                ▼
Camera Access → Database Query → Image Upload → YOLOv8 Model → Count Input → Local/Remote Storage
```

### Offline Synchronization Flow
```
Offline Record → Local Storage → Online Detection → Conflict Resolution → Server Sync → Status Update
     │              │                │                │                │              │
     ▼              ▼                ▼                ▼                ▼              ▼
Data Entry → IndexedDB → Network Check → Data Validation → API Submission → Sync Confirmation
```

### Data Export Flow
```
Filter Selection → Query Execution → Data Processing → Format Conversion → File Generation → Download
     │                │                │                │                │              │
     ▼                ▼                ▼                ▼                ▼              ▼
Date/User Filter → Database Query → Result Aggregation → CSV/Excel → File Creation → Browser Download
```

---

## 🔒 Security Architecture

### Authentication & Authorization
**JWT Token Security:**
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 24 hours (configurable)
- **Refresh**: Automatic token refresh mechanism
- **Storage**: Secure HTTP-only cookies (production)

**Password Security:**
- **Hashing**: bcrypt with salt rounds (12)
- **Validation**: Minimum 8 characters, complexity requirements
- **Storage**: Hashed passwords only, never plaintext

**Role-Based Access Control:**
- **CHP Role**: Limited to assigned patients and personal records
- **Admin Role**: Full system access with audit logging
- **Supervisor Role**: Team performance monitoring and reporting

### Data Security
**Encryption:**
- **In Transit**: HTTPS/TLS 1.3 enforcement
- **At Rest**: Database encryption (production)
- **API Security**: Input validation and sanitization

**Access Control:**
- **API Rate Limiting**: Request throttling and abuse prevention
- **CORS Configuration**: Strict origin validation
- **SQL Injection Prevention**: Parameterized queries and ORM usage

**Audit & Compliance:**
- **Access Logging**: All user actions logged with timestamps
- **Data Retention**: Configurable retention policies
- **HIPAA Compliance**: Healthcare data protection standards

---

## 📊 Performance Architecture

### Frontend Performance
**PWA Optimization:**
- **Service Worker Caching**: Static assets and API responses
- **Code Splitting**: Route-based code splitting for faster loading
- **Image Optimization**: Automatic compression and format conversion
- **Lazy Loading**: Component and route lazy loading

**Performance Metrics:**
- **First Load**: < 3 seconds on 3G connection
- **Cached Load**: < 1 second with service worker
- **Time to Interactive**: < 5 seconds
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1

### Backend Performance
**API Optimization:**
- **Async Processing**: Non-blocking I/O operations
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis integration for frequently accessed data

**Performance Benchmarks:**
- **API Response Time**: < 500ms (95th percentile)
- **AI Processing**: < 10 seconds per image
- **Database Queries**: < 100ms (indexed queries)
- **Concurrent Users**: Support for 100+ simultaneous users

### Scalability Considerations
**Horizontal Scaling:**
- **Load Balancing**: Nginx reverse proxy with round-robin
- **Microservices**: Modular service architecture
- **Database Sharding**: Horizontal database partitioning
- **CDN Integration**: Global content delivery network

**Vertical Scaling:**
- **Resource Optimization**: Memory and CPU optimization
- **Database Tuning**: Query optimization and indexing
- **Caching Strategy**: Multi-layer caching implementation

---

## 🔌 Integration Architecture

### External Integrations
**Camera & Media APIs:**
- **getUserMedia**: Native camera access
- **File API**: Gallery image selection
- **Canvas API**: Image processing and manipulation

**Barcode Scanning:**
- **zxing-js**: Multi-format barcode detection
- **Camera Integration**: Real-time scanning capabilities
- **Error Handling**: Invalid barcode detection and recovery

**AI/ML Services:**
- **YOLOv8 Model**: Local computer vision processing
- **Model Updates**: Remote model versioning and updates
- **Performance Monitoring**: Model accuracy and speed metrics

### API Integration
**RESTful API Design:**
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Status Codes**: Standard HTTP status codes
- **Error Handling**: Consistent error response format
- **Versioning**: API versioning strategy

**Data Formats:**
- **Request**: JSON payloads with validation
- **Response**: JSON responses with metadata
- **File Upload**: Multipart form data
- **Export**: CSV and Excel formats

---

## 🚀 Deployment Architecture

### Development Environment
**Local Development:**
- **Backend**: FastAPI with hot reload (port 8000)
- **PWA**: React development server (port 3000)
- **Dashboard**: React development server (port 3001)
- **Database**: SQLite with sample data

**Development Tools:**
- **Code Quality**: ESLint, Prettier, Black
- **Testing**: Jest, Playwright, Pytest
- **Documentation**: Swagger/OpenAPI, Storybook
- **Version Control**: Git with conventional commits

### Production Environment
**Cloud Deployment:**
- **Backend**: Docker containers on Kubernetes
- **Frontend**: CDN deployment with service workers
- **Database**: Managed PostgreSQL service
- **Monitoring**: Application performance monitoring

**Infrastructure:**
- **Load Balancer**: Nginx with SSL termination
- **Auto-scaling**: Kubernetes horizontal pod autoscaler
- **Backup**: Automated database backups
- **Monitoring**: Prometheus, Grafana, and alerting

---

## 🧪 Testing Architecture

### Testing Strategy
**Multi-Layer Testing:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Testing Pyramid                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    ┌─────────────────────────────────────┐                 │
│                    │           E2E Tests                 │                 │
│                    │      (Playwright)                   │                 │
│                    │         ~20%                        │                 │
│                    └─────────────────────────────────────┘                 │
│                                                                             │
│              ┌─────────────────────────────────────────────┐               │
│              │         Integration Tests                   │               │
│              │        (API Testing)                       │               │
│              │           ~30%                             │               │
│              └─────────────────────────────────────────────┘               │
│                                                                             │
│        ┌─────────────────────────────────────────────────────┐             │
│        │              Unit Tests                             │             │
│        │         (Jest, Pytest)                             │             │
│        │              ~50%                                   │             │
│        └─────────────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Test Coverage Requirements:**
- **Backend**: 80% minimum coverage (branches, functions, lines)
- **Frontend**: 80% minimum coverage (branches, functions, lines)
- **E2E**: Critical user journey coverage
- **Performance**: Load testing and benchmarking

### Testing Tools
**Backend Testing:**
- **Unit Testing**: Pytest with mocking and fixtures
- **Integration Testing**: FastAPI TestClient
- **Coverage**: pytest-cov with HTML reports
- **Mocking**: pytest-mock for dependency isolation

**Frontend Testing:**
- **Unit Testing**: Jest with React Testing Library
- **E2E Testing**: Playwright for cross-browser testing
- **Coverage**: Jest coverage with Istanbul
- **Mocking**: MSW for API mocking

**Performance Testing:**
- **Load Testing**: Artillery or Locust
- **Lighthouse**: Core Web Vitals measurement
- **Profiling**: Chrome DevTools and React Profiler

---

## 📈 Monitoring & Observability

### Application Monitoring
**Performance Metrics:**
- **Response Times**: API endpoint performance tracking
- **Error Rates**: Error frequency and type analysis
- **Throughput**: Requests per second monitoring
- **Resource Usage**: CPU, memory, and disk utilization

**Business Metrics:**
- **User Engagement**: Active users and session duration
- **Feature Usage**: Pill counting and AI analysis usage
- **Data Quality**: AI accuracy and manual override rates
- **System Health**: Uptime and availability metrics

### Logging & Tracing
**Structured Logging:**
- **Log Levels**: DEBUG, INFO, WARN, ERROR, CRITICAL
- **Log Format**: JSON structured logging
- **Log Aggregation**: Centralized log collection
- **Log Retention**: Configurable retention policies

**Distributed Tracing:**
- **Request Tracing**: End-to-end request tracking
- **Performance Profiling**: Bottleneck identification
- **Error Correlation**: Error context and stack traces
- **User Journey Mapping**: Complete user workflow tracking

---

## 🔮 Future Architecture Considerations

### Scalability Enhancements
**Microservices Migration:**
- **Service Decomposition**: Break monolith into microservices
- **API Gateway**: Centralized routing and authentication
- **Service Mesh**: Inter-service communication management
- **Event-Driven Architecture**: Asynchronous event processing

**Advanced AI/ML:**
- **Custom Models**: Domain-specific pill detection models
- **Model Serving**: Dedicated ML model serving infrastructure
- **A/B Testing**: Model performance comparison
- **Continuous Learning**: Model retraining and improvement

### Technology Evolution
**Framework Updates:**
- **React 19**: Latest React features and performance
- **FastAPI 2.0**: Enhanced API framework capabilities
- **Python 3.12+**: Latest Python features and performance
- **Modern CSS**: CSS Grid, Container Queries, and Houdini

**Infrastructure Modernization:**
- **Serverless**: Function-as-a-Service deployment
- **Edge Computing**: CDN-based edge processing
- **GraphQL**: Flexible data querying and real-time updates
- **WebAssembly**: High-performance client-side processing

---

## 📋 Architecture Decision Records (ADRs)

### ADR-001: Progressive Web App Architecture
**Decision**: Use PWA technology for cross-platform compatibility
**Rationale**: Provides native app experience without app store distribution
**Consequences**: Offline capability, cross-platform support, easy updates

### ADR-002: FastAPI Backend Framework
**Decision**: Choose FastAPI over Django/Flask for backend development
**Rationale**: Modern async support, automatic API documentation, high performance
**Consequences**: Fast development, excellent documentation, async scalability

### ADR-003: YOLOv8 for Computer Vision
**Decision**: Implement YOLOv8 for pill detection
**Rationale**: State-of-the-art object detection, good balance of speed/accuracy
**Consequences**: High detection accuracy, reasonable processing speed

### ADR-004: IndexedDB for Offline Storage
**Decision**: Use IndexedDB over LocalStorage for offline data
**Rationale**: Better performance, larger storage capacity, transaction support
**Consequences**: Robust offline functionality, complex data management

---

**Document Approval:**
- **System Architect:** [Name] - [Date]
- **Technical Lead:** [Name] - [Date]
- **Security Officer:** [Name] - [Date]
- **DevOps Engineer:** [Name] - [Date]

---

*This architecture document serves as the technical foundation for the MMS Pill Counting System. All technical decisions and implementations should align with this architecture to ensure system consistency, scalability, and maintainability.*
