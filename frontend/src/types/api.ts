// Backend API data models based on backend/models.py

// RFQ Line Item (from backend models.py)
export interface RFQLineItem {
  rfq_id: string;
  line_item: string;
  quantity: number;
  unit_price: number;  // Backend uses Decimal, gets converted to number in JSON
  date_: string;       // Backend uses date, gets converted to string in JSON
}

// Enriched Line Item (from backend models.py) 
export interface EnrichedLineItem {
  rfq_id: string;
  original_line_item: string;
  quantity: number;
  unit_price: number | null;       // Backend uses Optional[Decimal], can be null
  date_: string;                   // Backend uses date, gets converted to string in JSON
  matched_sku?: string | null;     // Backend Optional[str]
  standard_name?: string | null;   // Backend Optional[str]
  category?: string | null;        // Backend Optional[str]
  manufacturer?: string | null;    // Backend Optional[str]
  match_confidence?: number | null; // Backend Optional[float]
}

// Frontend-specific interfaces for UI components
export interface LineItem {
  id: number;
  description: string;
  quantity: number;
  unit: string;
  notes?: string;
  confidence?: number;
  issues?: string[];
}

export interface MatchedItem {
  id: number;
  originalDescription: string;
  quantity: number;
  unit: string;
  suggestedSKU: string;
  suggestedName: string;
  confidence: number;
  price?: number;
  category?: string;
  manufacturer?: string;
}

// API Response Types (matching backend models.py exactly)
export interface ProcessingStatus {
  status: string;          // Backend uses str
  message: string;
  line_items?: RFQLineItem[] | null;  // Backend Optional[List[RFQLineItem]]
}

export interface MatchingResult {
  status: string;          // Backend uses str  
  message: string;
  enriched_data: EnrichedRFQ;  // Backend returns EnrichedRFQ directly
}

export interface EnrichedRFQ {
  line_items: EnrichedLineItem[];
}

export interface CatalogUploadResult {
  status: string;          // Backend returns plain dict with str
  message: string;
  products_count?: number; // Backend returns products_count, not catalog_indexed
}

// API Error Response
export interface APIError {
  status: 'error';
  message: string;
  details?: string;
}

// Catalog Status Type
export type CatalogStatus = 'none' | 'uploading' | 'success' | 'error';

// Upload File Status
export interface UploadedFile {
  file: File;
  id: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
}
