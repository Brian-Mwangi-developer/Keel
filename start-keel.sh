#!/bin/bash

# Keel Startup Script
# Starts DataHub (Docker), Keel Backend, and Keel Frontend
# Usage: ./start-keel.sh [--datahub-only] [--backend-only] [--frontend-only]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Config
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="${SCRIPT_DIR}/../Keel-Backend"
FRONTEND_DIR="${SCRIPT_DIR}"
DATAHUB_PORT=8080
BACKEND_PORT=8010
FRONTEND_PORT=3000
DATAHUB_CONTAINER_NAME="keel-datahub"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not on PATH"
        exit 1
    fi
    log_success "Docker found"
}

check_python() {
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is not installed or not on PATH"
        exit 1
    fi
    log_success "Python 3 found"
}

check_node() {
    if ! command -v npm &> /dev/null; then
        log_error "Node.js / npm is not installed or not on PATH"
        exit 1
    fi
    log_success "Node.js / npm found"
}

start_datahub() {
    log_info "Starting DataHub..."

    # Check if container is already running
    if docker ps --filter "name=${DATAHUB_CONTAINER_NAME}" --format '{{.Names}}' | grep -q "${DATAHUB_CONTAINER_NAME}"; then
        log_warning "DataHub container already running (${DATAHUB_CONTAINER_NAME})"
        return 0
    fi

    # Check if stopped container exists
    if docker ps -a --filter "name=${DATAHUB_CONTAINER_NAME}" --format '{{.Names}}' | grep -q "${DATAHUB_CONTAINER_NAME}"; then
        log_info "Removing stopped DataHub container..."
        docker rm "${DATAHUB_CONTAINER_NAME}" --force > /dev/null 2>&1 || true
    fi

    # Start DataHub
    docker run -d \
        --name "${DATAHUB_CONTAINER_NAME}" \
        -p ${DATAHUB_PORT}:8080 \
        -p 9002:9002 \
        -p 9092:9092 \
        -e DATAHUB_PLAY=true \
        acryldata/datahub-gms:head > /dev/null 2>&1

    # Wait for DataHub to be ready
    log_info "Waiting for DataHub to be ready (this may take 30-60 seconds)..."
    for i in {1..60}; do
        if curl -s http://localhost:${DATAHUB_PORT}/health > /dev/null 2>&1; then
            log_success "DataHub is running on http://localhost:${DATAHUB_PORT}"
            log_info "DataHub UI: http://localhost:9002"
            return 0
        fi
        echo -n "."
        sleep 1
    done

    log_error "DataHub failed to start within 60 seconds"
    docker logs "${DATAHUB_CONTAINER_NAME}" | tail -20
    exit 1
}

start_backend() {
    log_info "Starting Keel Backend..."

    if [ ! -d "${BACKEND_DIR}" ]; then
        log_error "Backend directory not found: ${BACKEND_DIR}"
        log_info "Clone it with: git clone https://github.com/Brian-Mwangi-developer/Keel-Backend.git ../"
        exit 1
    fi

    cd "${BACKEND_DIR}"

    # Check if venv exists
    if [ ! -d ".venv" ]; then
        log_info "Creating Python virtual environment..."
        python3 -m venv .venv
    fi

    # Activate venv
    source .venv/bin/activate

    # Install dependencies
    if [ ! -f ".installed" ] || [ "requirements.txt" -nt ".installed" ]; then
        log_info "Installing Python dependencies..."
        pip install -q -r requirements.txt
        touch .installed
    fi

    # Check .env file
    if [ ! -f ".env" ]; then
        log_warning ".env file not found. Creating from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_info "Created .env file. Edit it to add QWEN_API_KEY and other settings."
            log_info "Continuing with default/minimal config..."
        else
            log_error ".env.example not found"
            exit 1
        fi
    fi

    # Start backend in background
    log_info "Starting uvicorn on port ${BACKEND_PORT}..."
    nohup uvicorn app.main:app --port ${BACKEND_PORT} > backend.log 2>&1 &
    BACKEND_PID=$!

    # Wait for backend to be ready
    log_info "Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:${BACKEND_PORT}/health > /dev/null 2>&1; then
            log_success "Keel Backend is running on http://localhost:${BACKEND_PORT}"
            log_info "Backend logs: ${BACKEND_DIR}/backend.log"
            return 0
        fi
        echo -n "."
        sleep 1
    done

    log_error "Backend failed to start within 30 seconds"
    cat backend.log | tail -20
    exit 1
}

start_frontend() {
    log_info "Starting Keel Frontend..."

    cd "${FRONTEND_DIR}"

    # Create .env.local if it doesn't exist
    if [ ! -f ".env.local" ]; then
        log_info "Creating .env.local..."
        cat > .env.local << EOF
KEEL_BACKEND_URL=http://localhost:${BACKEND_PORT}
EOF
        log_success "Created .env.local"
    fi

    # Install dependencies
    if [ ! -d "node_modules" ]; then
        log_info "Installing Node.js dependencies (npm install)..."
        npm install > /dev/null 2>&1
    fi

    # Start frontend in background
    log_info "Starting Next.js dev server on port ${FRONTEND_PORT}..."
    nohup npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!

    # Wait for frontend to be ready
    log_info "Waiting for frontend to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:${FRONTEND_PORT} > /dev/null 2>&1; then
            log_success "Keel Frontend is running on http://localhost:${FRONTEND_PORT}"
            log_info "Frontend logs: ${FRONTEND_DIR}/frontend.log"
            return 0
        fi
        echo -n "."
        sleep 1
    done

    log_error "Frontend failed to start within 30 seconds"
    cat frontend.log | tail -20
    exit 1
}

print_summary() {
    echo ""
    echo -e "${GREEN}========== Keel is ready! ==========${NC}"
    echo ""
    echo -e "Frontend:  ${GREEN}http://localhost:${FRONTEND_PORT}${NC}"
    echo -e "Backend:   ${GREEN}http://localhost:${BACKEND_PORT}${NC}"
    echo -e "DataHub:   ${GREEN}http://localhost:${DATAHUB_PORT}${NC}"
    echo -e "DataHub UI: ${GREEN}http://localhost:9002${NC}"
    echo ""
    echo -e "${YELLOW}Open http://localhost:${FRONTEND_PORT} in your browser to start!${NC}"
    echo ""
    echo -e "${BLUE}To stop all services:${NC}"
    echo -e "  docker stop ${DATAHUB_CONTAINER_NAME}"
    echo ""
    echo -e "${BLUE}View logs:${NC}"
    echo -e "  Backend:  tail -f ${BACKEND_DIR}/backend.log"
    echo -e "  Frontend: tail -f ${FRONTEND_DIR}/frontend.log"
    echo ""
}

show_help() {
    cat << EOF
Keel Startup Script

Usage:
  ./start-keel.sh              # Start all three: DataHub, backend, frontend
  ./start-keel.sh --datahub    # Start only DataHub
  ./start-keel.sh --backend    # Start only backend (DataHub must be running)
  ./start-keel.sh --frontend   # Start only frontend
  ./start-keel.sh --help       # Show this help message

Environment:
  DATAHUB_PORT         (default: 8080)
  BACKEND_PORT         (default: 8010)
  FRONTEND_PORT        (default: 3000)

Requirements:
  - Docker (for DataHub)
  - Python 3.12+ (for backend)
  - Node.js 18+ (for frontend)

Before first run:
  1. Clone the backend: git clone https://github.com/Brian-Mwangi-developer/Keel-Backend.git ../
  2. Create .env in Keel-Backend/ with QWEN_API_KEY and other settings
  3. Run: ./start-keel.sh

EOF
}

# Main logic
MODE=${1:-"all"}

case "${MODE}" in
    --help)
        show_help
        exit 0
        ;;
    --datahub-only)
        check_docker
        start_datahub
        print_summary
        ;;
    --backend-only)
        check_python
        start_backend
        print_summary
        ;;
    --frontend-only)
        check_node
        start_frontend
        print_summary
        ;;
    --all|"")
        check_docker
        check_python
        check_node

        start_datahub
        log_info ""

        start_backend
        log_info ""

        start_frontend
        log_info ""

        print_summary

        # Keep script running and show logs
        log_info "Press Ctrl+C to stop all services"
        wait
        ;;
    *)
        log_error "Unknown option: ${MODE}"
        echo ""
        show_help
        exit 1
        ;;
esac
