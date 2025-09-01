#!/bin/bash

# Doc Processor Fullstack Startup Script
# Launches both backend and frontend in separate terminals

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

# Function to detect terminal and launch commands
launch_in_terminal() {
    local title="$1"
    local command="$2"
    local dir="$3"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript <<EOF
tell application "Terminal"
    do script "cd '$dir' && echo '🎯 $title' && $command"
    set custom title of front window to "$title"
end tell
EOF
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux - try different terminal emulators
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal --title="$title" --working-directory="$dir" -- bash -c "echo '🎯 $title' && $command; exec bash"
        elif command -v konsole &> /dev/null; then
            konsole --title "$title" --workdir "$dir" -e bash -c "echo '🎯 $title' && $command; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -title "$title" -e "cd '$dir' && echo '🎯 $title' && $command; exec bash" &
        else
            echo "⚠️  No suitable terminal emulator found for Linux"
            echo "   Please install gnome-terminal, konsole, or xterm"
            exit 1
        fi
    else
        echo "⚠️  Unsupported operating system: $OSTYPE"
        echo "   This script supports macOS and Linux"
        exit 1
    fi
}

echo ""
echo "🎯 Launching Backend Server..."
launch_in_terminal "Doc Processor Backend" "./start.sh" "$BACKEND_DIR"

# Give backend a moment to start
sleep 2

echo "🎯 Launching Frontend Development Server..."
launch_in_terminal "Doc Processor Frontend" "./start.sh" "$FRONTEND_DIR"

echo ""
echo "🎉 Fullstack application is starting!"
echo "🔗 Backend API: http://localhost:8000"
echo "🔗 Frontend App: http://localhost:8080"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""
echo "💡 Both services are running in separate terminal windows"
echo "💡 Close those terminal windows to stop the services"
echo "💡 Use Ctrl+C in each terminal to gracefully shut down"
