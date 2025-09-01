# DocProcessor

An MVP application for processing RFQ documents and matching line items with product catalogs using AI.

## Overview

DocProcessor streamlines the RFQ (Request for Quote) workflow by:
1. **Parsing RFQ documents** (PDF, DOCX) to extract line items
2. **Matching line items** with your product catalog using vector similarity
3. **Exporting enriched data** as CSV with matched SKU information

## Architecture

- **Frontend**: React + TypeScript (Vite, Tailwind, shadcn/ui)
- **Backend**: FastAPI + Python (LlamaParse, OpenAI LLM, vector search)
- **Processing**: Stateless, in-memory operations (no database)

## Quick Start

1. **Clone and setup**:
   ```bash
   git clone https://github.com/saminkhan1/DocProcessor.git
   cd DocProcessor
   ```

2. **Configure environment**:
   ```bash
   # Backend configuration
   cd backend
   cp env.example .env
   # Add your LLAMA_CLOUD_API_KEY and OPENAI_API_KEY
   cd ..
   ```

3. **Start the application**:
   ```bash
   ./start.sh
   ```

   This will start both frontend (http://localhost:5173) and backend (http://localhost:8000).

## Workflow

### 1. Catalog Setup (One-time)
- Upload your product catalog CSV
- System creates searchable vector index

### 2. RFQ Processing
- Upload RFQ document → AI extracts line items
- Match line items → Vector similarity finds best SKU matches
- Export CSV → Download enriched data with matched products

## Demo Files

Sample files are provided in `demo_files/` to test the application:
- `invoice.pdf` - Sample RFQ document for parsing
- `product-catalog.csv` - Sample product catalog for matching

### Demo Video
Watch the application in action: [RFQ Automation Demo](https://drive.google.com/file/d/1a9KiM0YpemuyH6kRl2khqREMayPyiJb6/view?usp=sharing)

## Requirements

- Node.js (for frontend)
- Python 3.8+ (for backend)
- API keys:
  - LlamaCloud API key
  - OpenAI API key

## Project Structure

```
DocProcessor/
├── frontend/           # React frontend
├── backend/            # FastAPI backend
├── start.sh           # Start both services
└── README.md          # This file
```

## Development

Each component has its own README with specific instructions:
- [Frontend README](frontend/README.md)
- [Backend README](backend/README.md)
