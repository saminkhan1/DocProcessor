#!/bin/bash

# Doc Processor Backend Startup Script

echo "🚀 Starting Doc Processor Backend..."
echo "=================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ .env file created from template"
        echo "🔧 Please edit .env and add your API keys before running again"
        exit 1
    else
        echo "❌ env.example not found. Please create .env manually"
        exit 1
    fi
fi

# Check if required environment variables are set
source .env

if [ -z "$LLAMA_CLOUD_API_KEY" ] || [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Missing required API keys in .env file"
    echo "   Please set LLAMA_CLOUD_API_KEY and OPENAI_API_KEY"
    exit 1
fi

echo "✅ Environment configuration found"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "🔧 Creating virtual environment..."
    python3 -m venv venv
fi

echo "🔧 Activating virtual environment..."
source venv/bin/activate

echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo "🌐 Starting server..."
echo "📖 API Documentation: http://localhost:8000/docs"
echo "🔍 Health Check: http://localhost:8000/"
echo ""

python run.py
