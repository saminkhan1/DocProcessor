# Backend

FastAPI backend for RFQ document processing and SKU matching.

## Tech Stack

- FastAPI + Python
- LlamaParse + OpenAI LLM
- Vector similarity search
- In-memory processing (no database)

## Development

```sh
./start.sh
```

## API Endpoints

- `POST /upload-catalog` - Upload product catalog CSV
- `POST /upload-rfq` - Upload and parse RFQ document  
- `POST /match-skus` - Match line items with catalog
- `POST /export-csv` - Export enriched data as CSV
- `GET /` - Health check

## Configuration

Copy `env.example` to `.env` and add:
```bash
LLAMA_CLOUD_API_KEY=your-key-here
OPENAI_API_KEY=your-key-here
```

## Catalog Format

CSV with columns: `sku`, `standard_name`, `category`, `manufacturer`, `description`, `unit_price`