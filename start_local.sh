#!/bin/bash

# MMS Pill Counting System - Local Startup Script
# This script starts all components of the system locally

echo "🚀 Starting MMS Pill Counting System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}Port $1 is already in use!${NC}"
        return 1
    else
        return 0
    fi
}

# Function to kill process on port
kill_port() {
    echo -e "${YELLOW}Killing process on port $1...${NC}"
    lsof -ti:$1 | xargs kill -9 2>/dev/null || true
    sleep 1
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command_exists python3; then
    echo -e "${RED}Python 3 is not installed! Please install Python 3.9 or higher.${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}Node.js is not installed! Please install Node.js 16 or higher.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}npm is not installed! Please install npm.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Check and kill processes on required ports
echo -e "${BLUE}Checking for existing processes...${NC}"
kill_port 8000
kill_port 3000
kill_port 3001

# Store current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Start Backend
echo -e "${BLUE}Starting Backend (FastAPI)...${NC}"
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${BLUE}Activating virtual environment...${NC}"
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/lib/python*/site-packages/fastapi" ]; then
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    pip install --upgrade pip
    pip install -r requirements.txt
fi

# Initialize database if needed
if [ ! -f "mms_pill_counting.db" ]; then
    echo -e "${YELLOW}Initializing database...${NC}"
    python init_db.py
fi

# Start backend server in background
echo -e "${GREEN}Starting backend server on http://localhost:8000${NC}"
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 5

# Check if backend started successfully
if ! check_port 8000; then
    echo -e "${RED}Backend failed to start on port 8000${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend started successfully${NC}"

# Start PWA Frontend
echo -e "${BLUE}Starting PWA Frontend...${NC}"
cd ../pwa

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing PWA dependencies...${NC}"
    npm install
fi

# Start PWA server in background
echo -e "${GREEN}Starting PWA server on http://localhost:3000${NC}"
npm start &
PWA_PID=$!

# Wait a moment for PWA to start
sleep 5

# Check if PWA started successfully
if ! check_port 3000; then
    echo -e "${RED}PWA failed to start on port 3000${NC}"
    exit 1
fi

echo -e "${GREEN}✅ PWA started successfully${NC}"

# Start Dashboard
echo -e "${BLUE}Starting Dashboard...${NC}"
cd ../dashboard

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing Dashboard dependencies...${NC}"
    npm install
fi

# Start dashboard server in background
echo -e "${GREEN}Starting dashboard server on http://localhost:3001${NC}"
npm start &
DASHBOARD_PID=$!

# Wait for all services to start
sleep 5

# Check if dashboard started successfully
if ! check_port 3001; then
    echo -e "${RED}Dashboard failed to start on port 3001${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dashboard started successfully${NC}"

# Final status check
echo ""
echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo ""
echo -e "${BLUE}🌐 Access your applications:${NC}"
echo -e "${GREEN}   • PWA App:     http://localhost:3000${NC}"
echo -e "${GREEN}   • Dashboard:   http://localhost:3001${NC}"
echo -e "${GREEN}   • API Docs:    http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}📱 Test Credentials:${NC}"
echo -e "${YELLOW}   Email: chp1@mms.org${NC}"
echo -e "${YELLOW}   Password: password123${NC}"
echo ""
echo -e "${BLUE}💡 Chrome Tips:${NC}"
echo -e "${BLUE}   • Open Chrome and navigate to the URLs above${NC}"
echo -e "${BLUE}   • Allow camera permissions for pill detection features${NC}"
echo -e "${BLUE}   • Use F12 to open Chrome Developer Tools${NC}"
echo -e "${BLUE}   • Click the device icon in DevTools to test mobile view${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping all services...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $PWA_PID 2>/dev/null || true
    kill $DASHBOARD_PID 2>/dev/null || true
    
    # Kill any remaining processes on our ports
    kill_port 8000
    kill_port 3000
    kill_port 3001
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Keep script running and monitor processes
while true; do
    # Check if any of our processes are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}Backend process died unexpectedly${NC}"
        cleanup
    fi
    
    if ! kill -0 $PWA_PID 2>/dev/null; then
        echo -e "${RED}PWA process died unexpectedly${NC}"
        cleanup
    fi
    
    if ! kill -0 $DASHBOARD_PID 2>/dev/null; then
        echo -e "${RED}Dashboard process died unexpectedly${NC}"
        cleanup
    fi
    
    sleep 10
done
