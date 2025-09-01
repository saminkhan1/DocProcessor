import asyncio
import logging
from typing import Optional
import pandas as pd
from llama_index.core import VectorStoreIndex, Document
from llama_index.core.retrievers import BaseRetriever

from models import RFQOutput, EnrichedLineItem, EnrichedRFQ
from config import get_settings

def create_product_catalog_index(catalog_df: pd.DataFrame) -> BaseRetriever:
    """
    Create a vector store index from the product catalog DataFrame.
    """
    documents = []
    for _, row in catalog_df.iterrows():
        text = f"{row['standard_name']} {row['manufacturer']} {row['description']}"
        metadata = {
            "sku": row["sku"],
            "standard_name": row["standard_name"],
            "category": row["category"],
            "manufacturer": row["manufacturer"],
            "unit_price": row["unit_price"]
        }
        doc = Document(text=text, metadata=metadata)
        documents.append(doc)

    index = VectorStoreIndex.from_documents(documents)
    return index.as_retriever(similarity_top_k=1)

class SKUMatcherService:
    """
    Service for matching RFQ line items with product catalog SKUs using vector search.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.catalog_retriever: Optional[BaseRetriever] = None
        self.logger = logging.getLogger(__name__)
        
    async def initialize(self):
        """Initialize the service"""
        pass
    
    async def create_catalog_index(self, catalog_df: pd.DataFrame) -> int:
        """
        Create a vector store index from the product catalog DataFrame.
        """
        try:
            # Validate required columns from settings
            required_columns = self.settings.catalog_required_columns
            missing_columns = [col for col in required_columns if col not in catalog_df.columns]
            if missing_columns:
                raise ValueError(f"Missing required columns: {missing_columns}")
            
            self.catalog_retriever = create_product_catalog_index(catalog_df)
            
            return len(catalog_df)
            
        except Exception as e:
            self.logger.error(f"Catalog indexing failed: {str(e)}")
            raise Exception(f"Error creating catalog index: {str(e)}")
    
    async def match_line_items(self, rfq_data: RFQOutput) -> EnrichedRFQ:
        """
        Match RFQ line items with product catalog SKUs.
        """
        if not self.is_catalog_loaded():
            raise ValueError("Product catalog not loaded")
        
        try:
            enriched_items = []
            for i, item in enumerate(rfq_data.line_items, 1):
                matches = await self.catalog_retriever.aretrieve(item.line_item)

                if matches:
                    top_match = matches[0]
                    metadata = top_match.metadata
                    # Ensure confidence score is a valid float between 0.0 and 1.0
                    confidence = top_match.score if hasattr(top_match, 'score') and top_match.score is not None else 0.0
                    confidence = max(0.0, min(1.0, float(confidence)))
                    
                    enriched_item = EnrichedLineItem(
                        rfq_id=item.rfq_id,
                        original_line_item=item.line_item,
                        quantity=item.quantity,
                        unit_price=item.unit_price,
                        date_=item.date_,
                        matched_sku=metadata.get("sku"),
                        standard_name=metadata.get("standard_name"),
                        category=metadata.get("category"),
                        manufacturer=metadata.get("manufacturer"),
                        match_confidence=confidence
                    )
                else:
                    enriched_item = EnrichedLineItem(
                        rfq_id=item.rfq_id,
                        original_line_item=item.line_item,
                        quantity=item.quantity,
                        unit_price=item.unit_price,
                        date_=item.date_,
                        # No match found - all optional fields remain None
                        match_confidence=0.0
                    )
                enriched_items.append(enriched_item)

            return EnrichedRFQ(line_items=enriched_items)
            
        except Exception as e:
            self.logger.error(f"SKU matching failed: {str(e)}")
            raise Exception(f"Error matching SKUs: {str(e)}")
    
    def is_catalog_loaded(self) -> bool:
        """Check if catalog is loaded and ready for matching"""
        return self.catalog_retriever is not None