from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import io
import tempfile
import os
import logging
from typing import List, Optional
import pandas as pd
from datetime import datetime
import asyncio

from models import (
    RFQOutput, 
    EnrichedRFQ,
    ProcessingStatus,
    MatchingResult
)
from services.document_parser import DocumentParserService
from services.sku_matcher import SKUMatcherService
from config import get_settings

# Get settings
settings = get_settings()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Document processing and SKU matching API for RFQ documents",
    version=settings.app_version
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
parser_service = DocumentParserService()
sku_matcher_service = SKUMatcherService()

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        # Settings are validated on import via get_settings()
        
        # Initialize services
        await parser_service.initialize()
        await sku_matcher_service.initialize()
        
        logger.info("Doc Processor Backend initialized")
        
    except Exception as e:
        logger.error(f"Backend initialization failed: {str(e)}")
        raise

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Doc Processor API is running", "status": "healthy"}

@app.post("/upload-rfq", response_model=ProcessingStatus)
async def upload_rfq_document(file: UploadFile = File(...)):
    """
    Upload and process RFQ document
    Returns processing status and extracted line items
    
    Note: LlamaParse requires a file path, so we create a temporary file.
    UploadFile is a SpooledTemporaryFile that stays in memory for small files.
    """
    # Validate file type
    file_extension = os.path.splitext(file.filename)[1]
    if file_extension.lower() not in settings.allowed_file_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed types: {', '.join(settings.allowed_file_types)}"
        )
    
    temp_file_path = None
    try:
        # Create temporary file for LlamaParse (which requires a file path)
        file_content = await file.read()
        file_suffix = os.path.splitext(file.filename)[1]
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_suffix) as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name
        
        # Parse document and extract line items
        rfq_data = await parser_service.parse_rfq_document(temp_file_path, file.filename)
        
        logger.info(f"RFQ processed: {file.filename} - {len(rfq_data.line_items)} items extracted")
        return ProcessingStatus(
            status="completed",
            message=f"Successfully extracted {len(rfq_data.line_items)} line items",
            line_items=rfq_data.line_items
        )
        
    except Exception as e:
        logger.error(f"RFQ processing failed: {file.filename} - {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")
    
    finally:
        # Always clean up temp file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except:
                pass  # Ignore cleanup errors

@app.post("/upload-catalog")
async def upload_product_catalog(file: UploadFile = File(...)):
    """
    Upload product catalog CSV file and create searchable index
    """
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="Product catalog must be a CSV file"
        )
    
    try:
        # Read CSV content directly from UploadFile (no temp file needed for pandas)
        content = await file.read()
        csv_data = pd.read_csv(io.StringIO(content.decode('utf-8')))
        
        # Validate required columns from settings
        required_columns = settings.catalog_required_columns
        missing_columns = [col for col in required_columns if col not in csv_data.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {missing_columns}"
            )
        
        # Create catalog index
        catalog_count = await sku_matcher_service.create_catalog_index(csv_data)
        
        logger.info(f"Catalog indexed: {catalog_count} products from {file.filename}")
        return {
            "status": "success",
            "message": f"Product catalog uploaded successfully. Indexed {catalog_count} products.",
            "products_count": catalog_count
        }
        
    except Exception as e:
        logger.error(f"Catalog processing failed: {file.filename} - {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing catalog: {str(e)}")

@app.post("/match-skus", response_model=MatchingResult)
async def match_skus_to_line_items(rfq_data: RFQOutput):
    """
    Match RFQ line items with product catalog SKUs
    """
    try:
        # Check if catalog is loaded
        if not sku_matcher_service.is_catalog_loaded():
            raise HTTPException(
                status_code=400,
                detail="Product catalog not loaded. Please upload a catalog first."
            )
        
        # Perform SKU matching
        enriched_rfq = await sku_matcher_service.match_line_items(rfq_data)
        
        matched_count = sum(1 for item in enriched_rfq.line_items if item.matched_sku)
        logger.info(f"SKU matching: {matched_count}/{len(enriched_rfq.line_items)} items matched")
        
        return MatchingResult(
            status="completed",
            message="SKU matching completed successfully",
            enriched_data=enriched_rfq
        )
        
    except Exception as e:
        logger.error(f"SKU matching failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error matching SKUs: {str(e)}")

@app.post("/export-csv")
async def export_enriched_data_csv(enriched_data: EnrichedRFQ):
    """
    Export enriched RFQ data as CSV
    """
    try:
        # Convert to DataFrame for CSV export
        output_data = []
        for item in enriched_data.line_items:
            output_data.append({
                "rfq_id": item.rfq_id,
                "line_item": item.original_line_item,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price) if item.unit_price is not None else None,
                "date": item.date_,
                "matched_sku": item.matched_sku,
                "standard_name": item.standard_name,
                "category": item.category,
                "manufacturer": item.manufacturer,
                "match_confidence": item.match_confidence
            })
        
        df = pd.DataFrame(output_data)
        
        # Create CSV in memory
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue()
        csv_buffer.close()
        
        # Return as streaming response
        filename = f"enriched_rfq_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"CSV export failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error exporting CSV: {str(e)}")