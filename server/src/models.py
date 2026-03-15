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
    ACTIVITIES = "ACTIVITIES"
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
    SHOPPING = "SHOPPING"
    OTHER = "OTHER"


class SessionModel(BaseModel):
    """Base model with shared session_id validator."""
    session_id: str = Field(..., description="Session ID for data isolation")


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


class DatabaseTransaction(SessionModel):
    """A transaction as stored in the database."""
    id: Optional[int] = Field(None, description="Database ID")
    bank: BankType = Field(..., description="Bank name")
    date: datetime_date = Field(..., description="Transaction date")
    description: str = Field(..., description="Transaction description")
    amount: float = Field(..., description="Transaction amount")
    category: TransactionCategory = Field(..., description="Transaction category")

    class Config:
        use_enum_values = True


# API Request Models
class FileUploadRequest(SessionModel):
    """Request model for file upload."""
    pass


class RecordsRequest(SessionModel):
    """Request model for getting records."""
    bank_name: Optional[str] = Field(None, description="Optional bank name filter")
    months: Optional[List[str]] = Field(None, description="Optional list of month numbers to filter (e.g. ['01', '03'])")

    @validator('bank_name')
    def validate_bank_name(cls, v):
        if v is not None:
            return v.upper()
        return v


class ClearRequest(SessionModel):
    """Request model for clearing records."""
    pass


class SessionIncomeRequest(SessionModel):
    """Request model for saving monthly income for a session."""
    monthly_income: float = Field(..., description="User's monthly income in USD")


class SessionIncomeResponse(BaseModel):
    """Response model for session income endpoint."""
    session_id: str = Field(..., description="Session ID")
    monthly_income: float = Field(..., description="Saved monthly income")


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


# Category Management Models
class CategoryUpsertRequest(SessionModel):
    """Request to create or update a session-specific category."""
    keywords: List[str] = Field(..., description="Keywords that trigger this category")

    @validator('keywords')
    def clean_keywords(cls, v):
        return [kw.upper().strip() for kw in v if kw.strip()]


class CategoryDeleteRequest(SessionModel):
    """Request to delete a session-specific category override."""
    pass


class CategoryActionResponse(BaseModel):
    """Response for category create/update/delete operations."""
    success: bool
    message: str
    category: str
    keywords: List[str]
    records_updated: int


class SessionCategoriesResponse(BaseModel):
    """Response with merged categories (global defaults + session overrides)."""
    categories: Dict[str, List[str]]
    session_overrides: Dict[str, List[str]]


# Edit Record Models
class EditRecordRequest(SessionModel):
    """Request model for editing a record."""
    id: int = Field(..., description="ID of the record to edit")
    category: Optional[TransactionCategory] = Field(None, description="New category for the record")
    description: Optional[str] = Field(None, description="New description for the record")
    amount: Optional[float] = Field(None, description="New amount for the record")

    @validator('amount')
    def validate_amount(cls, v):
        if v is not None and abs(v) > 1000000:  # Reasonable limit
            raise ValueError('Amount exceeds reasonable limit')
        return v

    @validator('description')
    def validate_description(cls, v):
        if v is not None:
            return v.strip()
        return v

    class Config:
        use_enum_values = True


class EditRecordResponse(BaseModel):
    """Response model for edit record endpoint."""
    success: bool = Field(..., description="Whether the edit was successful")
    message: str = Field(..., description="Descriptive message")
    updated_record: Optional[TransactionRecord] = Field(None, description="The updated record if successful")


# Enriched Response Models
class ChartDataset(BaseModel):
    """A single dataset for chart rendering."""
    label: str
    data: List[float]
    borderColor: Optional[str] = None
    backgroundColor: Optional[str] = None
    purchases: Optional[bool] = None
    payments: Optional[bool] = None


class ChartData(BaseModel):
    """Chart data with labels and datasets."""
    labels: List[str]
    datasets: List[ChartDataset]


class FinancialMetrics(BaseModel):
    """Pre-formatted financial metrics."""
    totalPurchases: str
    totalPayments: str
    netSpending: str
    avgPurchase: str
    transactionCount: int
    purchaseCount: int


class ChartsPayload(BaseModel):
    """All chart data grouped together."""
    lineData: ChartData
    pieData: ChartData
    weeklyData: ChartData


class EnrichedRecordsResponse(BaseModel):
    """Enriched response with records, charts, and metrics."""
    records: List[TransactionRecord]
    count: int
    charts: ChartsPayload
    metrics: FinancialMetrics
    availableBanks: List[str]
    availableMonths: List[str]
    monthly_income: Optional[float] = Field(None, description="User's saved monthly income for this session")
