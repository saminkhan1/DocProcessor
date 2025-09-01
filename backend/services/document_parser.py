import os
import asyncio
import logging
from typing import Optional
from datetime import datetime, date
import re
from pathlib import Path

from llama_cloud_services import LlamaExtract

from models import RFQOutput
from config import get_settings

class DocumentParserService:
    """
    Service for parsing RFQ documents and extracting structured line items.
    Uses LlamaExtract for document parsing and data extraction.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self.extractor: Optional[LlamaExtract] = None
        self.agent = None
        self.logger = logging.getLogger(__name__)
        
    async def initialize(self):
        """Initialize the LlamaExtract client and agent"""
        try:
            # Initialize LlamaExtract client
            self.extractor = LlamaExtract(api_key=self.settings.llama_cloud_api_key)
            
            # Try to get existing agent first, create if it doesn't exist
            try:
                # Try to get the existing agent
                self.agent = self.extractor.get_agent(name="rfq-parser")
            except Exception as e:
                # If agent doesn't exist, create a new one
                if "not found" in str(e).lower() or "404" in str(e):
                    self.agent = self.extractor.create_agent(
                        name="rfq-parser",
                        data_schema=RFQOutput
                    )
                else:
                    # Re-raise other exceptions
                    raise e
        except Exception as e:
            self.logger.error(f"DocumentParserService init failed: {str(e)}")
            raise
    
    async def parse_rfq_document(self, file_path: str, filename: str) -> RFQOutput:
        """
        Parse RFQ document and extract structured line items using LlamaExtract.
        
        Args:
            file_path: Path to the uploaded file
            filename: Original filename
            
        Returns:
            RFQOutput containing structured line items
        """
        try:
            # Extract data using LlamaExtract agent
            result = await asyncio.to_thread(self.agent.extract, file_path)
            
            # The result.data should already be an RFQOutput instance
            # If it's a dict, convert it to RFQOutput
            if isinstance(result.data, dict):
                rfq_output = RFQOutput(**result.data)
            elif isinstance(result.data, RFQOutput):
                rfq_output = result.data
            else:
                # Fallback: try to parse as RFQOutput
                rfq_output = RFQOutput.model_validate(result.data)
            
            return rfq_output
            
        except Exception as e:
            self.logger.error(f"Document parsing failed: {filename} - {str(e)}")
            raise Exception(f"Error parsing RFQ document: {str(e)}")