#!/bin/bash

# Doc Processor Fullstack Startup Script (macOS)
# Launches backend, frontend, and ngrok tunnel for backend

echo "🚀 Starting Doc Processor Fullstack Application..."
echo "================================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Check if directories exist
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found at: $BACKEND_DIR"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Frontend directory not found at: $FRONTEND_DIR"
    exit 1
fi

echo "✅ Backend directory found: $BACKEND_DIR"
echo "✅ Frontend directory found: $FRONTEND_DIR"

# Check if start scripts exist
if [ ! -f "$BACKEND_DIR/start.sh" ]; then
    echo "❌ Backend start script not found at: $BACKEND_DIR/start.sh"
    exit 1
fi

if [ ! -f "$FRONTEND_DIR/start.sh" ]; then
    echo "❌ Frontend start script not found at: $FRONTEND_DIR/start.sh"
    exit 1
fi

echo "✅ Start scripts found"

# Function to launch commands in macOS Terminal
launch_in_terminal() {
    local title="$1"
    local command="$2"
    local dir="$3"

    osascript <<EOF
tell application "Terminal"
    do script "cd '$dir' && echo '🎯 $title' && $command"
    set custom title of front window to "$title"
end tell
EOF
}

echo ""
echo "🎯 Launching Backend Server..."
launch_in_terminal "Doc Processor Backend" "./start.sh" "$BACKEND_DIR"

# Give backend a moment to start
sleep 2

echo "🎯 Launching Frontend Development Server..."
launch_in_terminal "Doc Processor Frontend" "./start.sh" "$FRONTEND_DIR"

# Give frontend a moment to start
sleep 1

# Launch ngrok tunnel for backend
echo ""
echo "🎯 Launching ngrok tunnel for backend..."
ngrok http --url=mammoth-stirring-remarkably.ngrok-free.app 8000 > /dev/null &
NGROK_BACKEND_PID=$!

echo "✅ ngrok tunnel started"
echo "🔗 Backend Public URL: https://mammoth-stirring-remarkably.ngrok-free.app"

echo ""
echo "🎉 Fullstack application is starting!"
echo "🔗 Backend API (local): http://localhost:8000"
echo "🔗 Frontend App (local): http://localhost:8080"
echo "📖 API Docs (local): http://localhost:8000/docs"
echo ""
echo "💡 Backend is publicly accessible via ngrok"
echo "💡 Both services are running in separate terminal windows"
echo "💡 Close those terminal windows to stop the services"
echo "💡 Use Ctrl+C in each terminal to gracefully shut down"
