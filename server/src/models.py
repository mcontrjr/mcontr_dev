"""
Pydantic models for type-safe API and database operations.
"""
from datetime import datetime
from datetime import date as datetime_date
from typing import Dict, List, Optional, Union
from uuid import UUID
from pydantic import BaseModel, Field, validator
from enum import Enum


class BankType(str, Enum):
    """Supported bank types."""
    AMEX = "AMEX"
    CITI = "CITI"
    DISCOVER = "DISCOVER"
    CAPITAL_ONE = "CAPITAL ONE"
    SCHWAB = "SCHWAB"


class TransactionCategory(str, Enum):
    """Transaction categories."""
    GAS = "GAS"
    LOANS = "LOANS"
    RENT = "RENT"
    TRAVEL = "TRAVEL"
    PAYPAL = "PAYPAL"
    AMAZON = "AMAZON"
    GROCERIES = "GROCERIES"
    TARGET = "TARGET"
    FOOD = "FOOD"
    AUTO = "AUTO"
    COSTCO = "COSTCO"
    STREAMING = "STREAMING"
    PHARMACY = "PHARMACY"
    GYM = "GYM"
    INTERNET = "INTERNET"
    LAUNDRY = "LAUNDRY"
    APPLE_PAY = "APPLE PAY"
    SKI = "SKI"
    PARKING = "PARKING"
    PAYMENT = "PAYMENT"
    DEPOSIT = "DEPOSIT"
    ATM = "ATM"
    UTILITIES = "UTILITIES"
    OTHER = "OTHER"


# Core Transaction Models
class ParsedTransaction(BaseModel):
    """A transaction parsed from bank statements."""
    bank: BankType = Field(..., description="Bank name")
    date: datetime_date = Field(..., description="Transaction date")
    description: str = Field(..., min_length=1, description="Transaction description")
    amount: float = Field(..., description="Transaction amount")
    category: TransactionCategory = Field(default=TransactionCategory.OTHER, description="Transaction category")

    @validator('amount')
    def validate_amount(cls, v):
        if abs(v) > 1000000:  # Reasonable limit
            raise ValueError('Amount exceeds reasonable limit')
        return v

    @validator('description')
    def validate_description(cls, v):
        return v.strip()

    class Config:
        use_enum_values = True


class DatabaseTransaction(BaseModel):
    """A transaction as stored in the database."""
    id: Optional[int] = Field(None, description="Database ID")
    bank: BankType = Field(..., description="Bank name")
    date: datetime_date = Field(..., description="Transaction date")
    description: str = Field(..., description="Transaction description")
    amount: float = Field(..., description="Transaction amount")
    category: TransactionCategory = Field(..., description="Transaction category")
    session_id: str = Field(..., description="Session ID for data isolation")

    @validator('session_id')
    def validate_session_id(cls, v):
        try:
            UUID(v)
        except ValueError:
            raise ValueError('session_id must be a valid UUID')
        return v

    class Config:
        use_enum_values = True


# API Request Models
class FileUploadRequest(BaseModel):
    """Request model for file upload."""
    session_id: str = Field(..., description="Session ID for data isolation")

    @validator('session_id')
    def validate_session_id(cls, v):
        try:
            UUID(v)
        except ValueError:
            raise ValueError('session_id must be a valid UUID')
        return v


class RecordsRequest(BaseModel):
    """Request model for getting records."""
    bank_name: Optional[str] = Field(None, description="Optional bank name filter")
    session_id: str = Field(..., description="Session ID for data isolation")

    @validator('bank_name')
    def validate_bank_name(cls, v):
        if v is not None:
            return v.upper()
        return v

    @validator('session_id')
    def validate_session_id(cls, v):
        try:
            UUID(v)
        except ValueError:
            raise ValueError('session_id must be a valid UUID')
        return v


class ClearRequest(BaseModel):
    """Request model for clearing records."""
    session_id: str = Field(..., description="Session ID for data isolation")

    @validator('session_id')
    def validate_session_id(cls, v):
        try:
            UUID(v)
        except ValueError:
            raise ValueError('session_id must be a valid UUID')
        return v


# API Response Models
class TransactionRecord(BaseModel):
    """Transaction record in API responses."""
    id: int = Field(..., description="Database ID")
    bank: BankType = Field(..., description="Bank name")
    date: datetime_date = Field(..., description="Transaction date")
    description: str = Field(..., description="Transaction description")
    amount: float = Field(..., description="Transaction amount")
    category: TransactionCategory = Field(..., description="Transaction category")

    class Config:
        use_enum_values = True


class RecordsResponse(BaseModel):
    """Response model for records endpoint."""
    records: List[TransactionRecord] = Field(..., description="List of transaction records")
    count: int = Field(..., description="Number of records")


class ParseResponse(BaseModel):
    """Response model for parse endpoint."""
    status: str = Field(..., description="Status of the operation")
    message: str = Field(..., description="Descriptive message")
    transactions_processed: Optional[int] = Field(None, description="Number of transactions processed")
    errors: Optional[List[str]] = Field(None, description="List of errors encountered")


class ClearResponse(BaseModel):
    """Response model for clear endpoint."""
    message: str = Field(..., description="Success message")
    records_deleted: int = Field(..., description="Number of records deleted")


class CategoriesResponse(BaseModel):
    """Response model for categories endpoint."""
    categories: Dict[str, List[str]] = Field(..., description="Category keywords mapping")


class SystemInfoResponse(BaseModel):
    """Response model for system info endpoint."""
    cpu: Dict[str, Union[int, float, Dict, None]] = Field(..., description="CPU information")
    memory: Dict[str, Union[int, float]] = Field(..., description="Memory information")
    threads: Dict[str, Union[int, str]] = Field(..., description="Thread information")
    platform: Dict[str, str] = Field(..., description="Platform information")
    disk: Dict[str, Union[int, float]] = Field(..., description="Disk information")
    timestamp: datetime = Field(..., description="Timestamp of system info collection")


class APIInfoResponse(BaseModel):
    """Response model for root endpoint."""
    message: str = Field(..., description="API description")
    version: str = Field(..., description="API version")
    status: str = Field(..., description="API status")
    endpoints: Dict[str, str] = Field(..., description="Available endpoints")


# Configuration Models
class BankConfiguration(BaseModel):
    """Configuration for bank statement parsing."""
    bank: BankType = Field(..., description="Bank name")
    start_index: int = Field(0, description="Starting page index for parsing")
    date_pattern: str = Field(r'^\d{2}\/\d{2}\/\d{2}', description="Date pattern regex")
    skip_date_in_desc: bool = Field(True, description="Whether to skip date in description")
    tabular_entries: bool = Field(False, description="Whether entries are in tabular format")
    checking: bool = Field(False, description="Whether this is a checking account")

    class Config:
        frozen = True  # Immutable configuration


# Database Operation Models
class DatabaseInsertResult(BaseModel):
    """Result of database insert operation."""
    inserted_count: int = Field(..., description="Number of records inserted")
    skipped_count: int = Field(0, description="Number of records skipped (duplicates)")
    errors: List[str] = Field(default_factory=list, description="List of errors encountered")


class DatabaseQueryResult(BaseModel):
    """Result of database query operation."""
    records: List[DatabaseTransaction] = Field(..., description="Retrieved records")
    count: int = Field(..., description="Number of records")


class DatabaseDeleteResult(BaseModel):
    """Result of database delete operation."""
    deleted_count: int = Field(..., description="Number of records deleted")
    message: str = Field(..., description="Success message")


# Error Models
class APIError(BaseModel):
    """Standardized API error response."""
    detail: str = Field(..., description="Error detail message")
    error_code: Optional[str] = Field(None, description="Error code")
    timestamp: datetime = Field(default_factory=datetime.now, description="Error timestamp")
