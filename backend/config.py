import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
from pydantic import field_validator

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    # API Settings
    app_name: str = "Doc Processor API"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"
    
    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8000
    
    # API Keys (no default value, will raise error if not set)
    llama_cloud_api_key: str
    openai_api_key: str
    
    # LlamaExtract Settings (replaces LlamaParse)
    # LlamaExtract handles extraction automatically with Pydantic schemas
    
    # LLM Settings
    openai_model: str = "gpt-5-nano"
    
    # File Upload Settings
    allowed_file_types: List[str] = [".pdf", ".doc", ".docx", ".txt", ".csv"]
    max_file_size: int = 52428800  # 50MB in bytes
    processing_timeout: int = 300  # 5 minutes
    
    # Logging settings
    log_level: str = "info"

    # CORS settings - more restrictive defaults for security
    cors_origins: Union[List[str], str] = ["http://localhost:8080"]
    
    # Security settings
    allowed_hosts: Union[List[str], str] = ["localhost", "127.0.0.1"]
    
    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            # Handle comma-separated string from .env file
            return [origin.strip() for origin in v.split(',')]
        return v
    
    @field_validator('allowed_hosts', mode='before')
    @classmethod
    def parse_allowed_hosts(cls, v):
        if isinstance(v, str):
            # Handle comma-separated string from .env file
            return [host.strip() for host in v.split(',')]
        return v

    # Catalog Settings
    catalog_required_columns: List[str] = [
        "sku", "standard_name", "category", 
        "manufacturer", "description", "unit_price"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False
    )

@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    This will raise a validation error if required environment variables are missing.
    """
    return Settings()
