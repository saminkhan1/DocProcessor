from typing import List, Optional
from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import date

# Pydantic Models for RFQ Data
class RFQLineItem(BaseModel):
    """
    Represents a single line item from an RFQ document.
    Each line item contains details about the requested product, quantity, and specifications.
    Represents a single line item from an RFQ document.
    """
    rfq_id: str = Field(
        description="Unique identifier for the RFQ document (e.g., 'RFQ-2024-001')"
    )
    line_item: str = Field(
        description="Description of the product or service as it appears in the RFQ"
    )
    quantity: int = Field(
        description="Number of units requested",
        ge=0  
    )
    unit_price: Decimal = Field(
        description="Price per unit in decimal format (e.g., 45.99)",
        ge=0  
    )
    date_: date = Field(
        description="Date of the RFQ in YYYY-MM-DD format"
    )

class RFQOutput(BaseModel):
    """
    Container model for all line items from an RFQ document.
    Used as the output format when parsing RFQ documents.
    Container model for all line items from an RFQ document.
    """
    line_items: List[RFQLineItem] = Field(
        description="List of all line items extracted from the RFQ"
    )

# Pydantic Models for Product Catalog
class ProductCatalog(BaseModel):
    """
    Represents a single product entry in the product catalog.
    Contains standardized product information and SKU details.
    """
    sku: str = Field(
        description="Stock Keeping Unit - unique identifier for the product (e.g., 'ACM-WX-001')"
    )
    standard_name: str = Field(
        description="Standardized product name used across the system"
    )
    category: str = Field(
        description="Product category or classification (e.g., 'Widgets', 'Fasteners')"
    )
    manufacturer: str = Field(
        description="Name of the product manufacturer or supplier"
    )
    description: str = Field(
        description="Detailed product description"
    )
    unit_price: Decimal = Field(
        description="Standard unit price in decimal format",
        gt=0
    )

# Pydantic Models for Enriched Output
class EnrichedLineItem(BaseModel):
    """
    Enhanced version of RFQLineItem that includes matched product catalog information.
    Combines original RFQ data with standardized product details.
    Enhanced version of RFQLineItem with matched product catalog information.
    """
    rfq_id: str = Field(
        description="Original RFQ identifier"
    )
    original_line_item: str = Field(
        description="Original product description from the RFQ"
    )
    quantity: int = Field(
        description="Quantity requested",
        ge=0
    )
    unit_price: Optional[Decimal] = Field(
        None,
        description="Original unit price from RFQ (null if not available)",
        ge=0
    )
    date_: date = Field(
        description="RFQ date"
    )
    matched_sku: Optional[str] = Field(
        None,
        description="Matched SKU from product catalog, if found"
    )
    standard_name: Optional[str] = Field(
        None,
        description="Standardized product name from catalog"
    )
    category: Optional[str] = Field(
        None,
        description="Product category from catalog"
    )
    manufacturer: Optional[str] = Field(
        None,
        description="Manufacturer information from catalog"
    )
    match_confidence: Optional[float] = Field(
        None,
        description="Confidence score of the SKU match (0.0 to 1.0)",
        ge=0.0, 
        le=1.0   
    )

class EnrichedRFQ(BaseModel):
    """
    Container model for enriched RFQ data.
    Contains all line items with their matched product catalog information.
    Container model for enriched RFQ data with matched catalog information.
    """
    line_items: List[EnrichedLineItem] = Field(
        description="List of all enriched line items with matched catalog data"
    )

# Minimal API Response Models (for FastAPI endpoints only)
class ProcessingStatus(BaseModel):
    """Simple response model for document processing status"""
    status: str = Field(description="Processing status")
    message: str = Field(description="Status message")
    line_items: Optional[List[RFQLineItem]] = Field(None, description="Extracted line items")

class MatchingResult(BaseModel):
    """Simple response model for SKU matching results"""
    status: str = Field(description="Matching status")
    message: str = Field(description="Status message")
    enriched_data: EnrichedRFQ = Field(description="Enriched RFQ data")