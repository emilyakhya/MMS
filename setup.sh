#!/bin/bash

# AI-Powered Pill Counting PWA System Setup Script
# This script sets up the complete system including PWA, Dashboard, and Backend

set -e

echo "🚀 Setting up AI-Powered Pill Counting PWA System"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.8+ first."
        exit 1
    fi
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        print_error "pip3 is not installed. Please install pip3 first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Setup backend
setup_backend() {
    print_status "Setting up FastAPI backend..."
    
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source venv/bin/activate
    
    # Install dependencies
    print_status "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Initialize database
    print_status "Initializing database..."
    python init_db.py
    
    print_success "Backend setup completed"
    cd ..
}

# Setup PWA
setup_pwa() {
    print_status "Setting up PWA frontend..."
    
    cd pwa
    
    # Install dependencies
    print_status "Installing PWA dependencies..."
    npm install
    
    # Create environment file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating PWA environment file..."
        cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development
EOF
    fi
    
    print_success "PWA setup completed"
    cd ..
}

# Setup dashboard
setup_dashboard() {
    print_status "Setting up Admin Dashboard..."
    
    cd dashboard
    
    # Install dependencies
    print_status "Installing dashboard dependencies..."
    npm install
    
    print_success "Dashboard setup completed"
    cd ..
}

# Create start script
create_start_script() {
    print_status "Creating start script..."
    
    cat > start.sh << 'EOF'
#!/bin/bash

# Start script for AI-Powered Pill Counting PWA System

echo "🚀 Starting AI-Powered Pill Counting PWA System"
echo "================================================"

# Function to kill background processes on exit
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID $PWA_PID $DASHBOARD_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting FastAPI backend..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start PWA
echo "Starting PWA frontend..."
cd pwa
npm start &
PWA_PID=$!
cd ..

# Start dashboard
echo "Starting Admin Dashboard..."
cd dashboard
npm start &
DASHBOARD_PID=$!
cd ..

echo ""
echo "✅ All services started successfully!"
echo ""
echo "🌐 Access URLs:"
echo "   PWA:        http://localhost:3000"
echo "   Dashboard:  http://localhost:3001"
echo "   API Docs:   http://localhost:8000/docs"
echo ""
echo "📱 PWA Installation:"
echo "   Desktop: Click install icon in Chrome address bar"
echo "   Mobile:  Add to Home Screen from Chrome menu"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all processes
wait
EOF

    chmod +x start.sh
    print_success "Start script created: ./start.sh"
}

# Create stop script
create_stop_script() {
    print_status "Creating stop script..."
    
    cat > stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping AI-Powered Pill Counting PWA System"

# Kill processes by port
pkill -f "python main.py" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

echo "✅ All services stopped"
EOF

    chmod +x stop.sh
    print_success "Stop script created: ./stop.sh"
}

# Create development script
create_dev_script() {
    print_status "Creating development script..."
    
    cat > dev.sh << 'EOF'
#!/bin/bash

# Development script for AI-Powered Pill Counting PWA System

echo "🔧 Development Mode - AI-Powered Pill Counting PWA System"
echo "========================================================"

# Check if backend is running
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "❌ Backend is not running. Please start the backend first:"
    echo "   cd backend && source venv/bin/activate && python main.py"
    exit 1
fi

echo "✅ Backend is running"

# Start PWA in development mode
echo "Starting PWA in development mode..."
cd pwa
npm start
EOF

    chmod +x dev.sh
    print_success "Development script created: ./dev.sh"
}

# Main setup function
main() {
    check_prerequisites
    setup_backend
    setup_pwa
    setup_dashboard
    create_start_script
    create_stop_script
    create_dev_script
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Start all services: ./start.sh"
    echo "2. Or start individually:"
    echo "   - Backend: cd backend && source venv/bin/activate && python main.py"
    echo "   - PWA: cd pwa && npm start"
    echo "   - Dashboard: cd dashboard && npm start"
    echo ""
    echo "🌐 Access URLs:"
    echo "   PWA:        http://localhost:3000"
    echo "   Dashboard:  http://localhost:3001"
    echo "   API Docs:   http://localhost:8000/docs"
    echo ""
    echo "📱 PWA Features:"
    echo "   - Works in Chrome desktop and mobile"
    echo "   - Install as native app"
    echo "   - Offline support"
    echo "   - Camera and barcode scanning"
    echo ""
    echo "🔧 Development:"
    echo "   - Use ./dev.sh for development mode"
    echo "   - Use ./stop.sh to stop all services"
    echo ""
}

# Run main function
main "$@"
