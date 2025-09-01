#!/usr/bin/env python3
"""
Doc Processor Backend Server
Run this script to start the FastAPI server
"""

import uvicorn
from dotenv import load_dotenv
import sys
from pathlib import Path

def main():
    """Main entry point for the application"""
    
    # Add the backend directory to the Python path
    backend_dir = Path(__file__).resolve().parent
    if str(backend_dir) not in sys.path:
        sys.path.insert(0, str(backend_dir))
    
    # Load environment variables from .env file
    env_path = backend_dir / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        print("📄 Loaded environment from .env file")

    try:
        # Import settings after loading .env to ensure validation
        from config import get_settings
        settings = get_settings()
        
        print("🚀 Starting Doc Processor Backend...")
        print(f"📁 Backend directory: {backend_dir}")
        print("🔑 API keys found ✓")
        print(f"🌐 Server will be available at: http://{settings.host}:{settings.port}")
        print(f"📖 API docs will be available at: http://{settings.host}:{settings.port}/docs")
        
        uvicorn.run(
            "main:app",
            host=settings.host,
            port=settings.port,
            reload=settings.debug,
            log_level=settings.log_level.lower(),
        )
    except (ValueError, ImportError) as e:
        print(f"❌ Error starting server: {e}")
        print("\nPlease ensure all required environment variables are set in your .env file.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
