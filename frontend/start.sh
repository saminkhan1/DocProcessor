#!/bin/bash

# Doc Processor Frontend Startup Script

echo "🎨 Starting Doc Processor Frontend..."
echo "==================================="

# Check if package.json exists
if [ ! -f package.json ]; then
    echo "❌ package.json not found. Are you in the correct directory?"
    exit 1
fi

echo "✅ Package configuration found"

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js from https://nodejs.org/"
    echo "   Or install with nvm: https://github.com/nvm-sh/nvm"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    echo "   Please install npm with Node.js"
    exit 1
fi

echo "✅ Node.js and npm found"
echo "📍 Node version: $(node --version)"
echo "📍 npm version: $(npm --version)"

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo "🚀 Starting development server..."
echo "🌐 Frontend will be available at: http://localhost:5173"
echo "🔄 Hot reload enabled - changes will be reflected automatically"
echo ""

npm run dev
