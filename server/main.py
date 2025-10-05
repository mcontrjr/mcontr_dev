import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException, Query, Form
from fastapi.middleware.cors import CORSMiddleware

from typing import List, Optional
import os
import psutil
import platform
import threading
from datetime import datetime

from src.parser import Parser
from src.logger import log
from src.handler import PostgresHandler
from src.config import CORS_ORIGINS, CORS_METHODS, MAX_FILE_SIZE, ALLOWED_FILE_TYPES, UPLOAD_DIRECTORY, API_VERSION, API_TITLE
from src.error_handler import handle_api_errors
from src.models import (
    APIInfoResponse, CategoriesResponse, RecordsResponse, ParseResponse,
    SystemInfoResponse, ClearResponse, TransactionRecord, EditRecordRequest, EditRecordResponse
)

app = FastAPI(
    title="Financial Statement Processing API",
    description="""
A comprehensive FastAPI backend service for processing PDF bank statements, extracting financial transactions,
and providing data analysis capabilities with session-based data isolation.

## Key Features
- Multi-bank PDF processing (American Express, Citi, Discover, Capital One, Schwab)
- Session-based data isolation for multi-user support
- Automated transaction categorization
- System monitoring and health checks
- Comprehensive error handling

## Session Management
Session IDs are required for all data operations to ensure complete data isolation between users.
Generate a UUID4 string for each user session and include it in all API calls.

## Supported Banks
- **American Express**: PDF statement processing with transaction tables
- **Citi**: Statement PDF with transaction details and amount extraction
- **Discover**: PDF statement processing with categorization
- **Capital One**: Tabular format transaction processing
- **Schwab**: Checking account statement processing

## Authentication
This API currently uses session-based isolation without authentication.
In production, implement proper authentication and authorization.
    """,
    version=API_VERSION,
    contact={
        "name": "API Support",
        "email": "support@mcontr.dev"
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT"
    },
    servers=[
        {
            "url": "https://mcontr.dev/api",
            "description": "Production server"
        },
        {
            "url": "http://localhost:8000",
            "description": "Development server"
        }
    ],
    root_path="/api",
    tags_metadata=[
        {
            "name": "Categories",
            "description": "Transaction categorization and keyword management"
        },
        {
            "name": "Records",
            "description": "Financial record retrieval and management"
        },
        {
            "name": "Processing",
            "description": "PDF processing and transaction extraction"
        },
        {
            "name": "System",
            "description": "System monitoring and diagnostics"
        }
    ]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=CORS_METHODS,
    allow_headers=["*"],  # Keep headers flexible for development
)
handler = PostgresHandler()


@app.get("/", response_model=APIInfoResponse)
async def root():
    """Root endpoint with API information."""
    return APIInfoResponse(
        message=API_TITLE,
        version=API_VERSION,
        status="running",
        endpoints={
            "categories": "/categories/",
            "records": "/records/",
            "parse": "/parse/",
            "system-info": "/system-info/",
            "clear": "/clear/",
            "docs": "/docs"
        }
    )


@app.get("/categories/", response_model=CategoriesResponse, tags=["Categories"])
@handle_api_errors("CATEGORIES_RETRIEVAL")
async def get_categories():
    """
    Retrieve categories from parser. The categories contain keyword strings that map back to it
    so if any keywords are found in the description we can defer the category.

    ex: {
    'GAS': ['GAS', 'CHEVRON', 'SHELL']
    ...
    }
    :return: hashmap of categories and keywords
    """
    categories = Parser.keyword_to_category
    return CategoriesResponse(categories=categories)


@app.get("/records/", response_model=RecordsResponse, tags=["Records"])
@handle_api_errors("RECORDS_RETRIEVAL")
async def get_records(bank_name: Optional[str] = Query(None), session_id: str = Query(...)):
    """
    Retrieve records from the database, optionally filtering by bank name.

    :param bank_name: Optional; filter results by the bank name.
    :param session_id: Session ID for data isolation.
    :return: List of records matching the criteria.
    """
    if bank_name is None:
        bank_name = ""
        log.info("No bank name passed in query. Returning all records...")
    bank_name = bank_name.upper()

    response = handler.get_records(bank_name, session_id)
    records = response.get('records', [])

    typed_records = []
    for record in records:
        typed_records.append(TransactionRecord(
            id=record[0],
            bank=record[1],
            date=record[2],
            description=record[3],
            amount=record[4],
            category=record[5]
        ))

    return RecordsResponse(records=typed_records, count=len(typed_records))


@app.post("/parse/", response_model=ParseResponse, tags=["Processing"])
@handle_api_errors("FILE_PROCESSING")
async def parse_upload_file(pdf_files: List[UploadFile] = File(...), session_id: str = Form(...)):
    """
    Endpoint to upload and parse PDF files.
    """
    log.info(f"Received {len(pdf_files)} files: {[file.filename for file in pdf_files]}")

    # Validate uploaded files
    for pdf_file in pdf_files:
        # Check file size
        if pdf_file.size and pdf_file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"File {pdf_file.filename} exceeds maximum size of {MAX_FILE_SIZE // (1024*1024)}MB")

        # Check file type
        if pdf_file.content_type not in ALLOWED_FILE_TYPES:
            raise HTTPException(status_code=400, detail=f"File {pdf_file.filename} must be a PDF file")

        # Check filename for path traversal
        if not pdf_file.filename or ".." in pdf_file.filename or "/" in pdf_file.filename:
            raise HTTPException(status_code=400, detail=f"Invalid filename: {pdf_file.filename}")

    # Save the uploaded file
    os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

    total_transactions = 0
    for pdf_file in pdf_files:
        log.info(f"Processing pdf file: {pdf_file.filename}")

        # Save the uploaded file
        pdf_path = f"{UPLOAD_DIRECTORY}/{pdf_file.filename}"
        with open(pdf_path, "wb") as buffer:
            shutil.copyfileobj(pdf_file.file, buffer)

        # Process each PDF file
        statement = Parser(pdf_path)
        handler.save_to_database(statement.purchases, session_id)
        total_transactions += len(statement.purchases)

    return ParseResponse(
        status="success",
        message="File processed and data saved to database",
        transactions_processed=total_transactions
    )


@app.get("/system-info/", response_model=SystemInfoResponse, tags=["System"])
@handle_api_errors("SYSTEM_INFO")
async def get_system_info():
    """
    Endpoint to retrieve system information including CPU, memory, threads, and platform details.
    """
    # CPU information
    cpu_info = {
        "cpu_count": psutil.cpu_count(),
        "cpu_count_logical": psutil.cpu_count(logical=True),
        "cpu_percent": psutil.cpu_percent(interval=1),
        "cpu_freq": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None
    }

    # Memory information
    memory = psutil.virtual_memory()
    memory_info = {
        "total": memory.total,
        "available": memory.available,
        "percent": memory.percent,
        "used": memory.used,
        "free": memory.free
    }

    # Thread information
    thread_info = {
        "active_threads": threading.active_count(),
        "current_thread": threading.current_thread().name
    }

    # Platform information
    platform_info = {
        "system": platform.system(),
        "node": platform.node(),
        "release": platform.release(),
        "version": platform.version(),
        "machine": platform.machine(),
        "processor": platform.processor(),
        "python_version": platform.python_version()
    }

    # Disk usage
    disk = psutil.disk_usage('/')
    disk_info = {
        "total": disk.total,
        "used": disk.used,
        "free": disk.free,
        "percent": (disk.used / disk.total) * 100
    }

    return SystemInfoResponse(
        cpu=cpu_info,
        memory=memory_info,
        threads=thread_info,
        platform=platform_info,
        disk=disk_info,
        timestamp=datetime.now()
    )



@app.put("/edit_record/", response_model=EditRecordResponse, tags=["Records"])
@handle_api_errors("RECORDS_UPDATE")
async def edit_record(request: EditRecordRequest):
    """
    Edit a record's fields such as category, description, or amount.
    
    :param request: EditRecordRequest containing record_id, updates, and session_id
    :return: EditRecordResponse with success status and updated record
    """
    # Prepare updates dictionary with only non-None fields
    updates = {}
    if request.category is not None:
        updates['category'] = request.category
    if request.description is not None:
        updates['description'] = request.description
    if request.amount is not None:
        updates['amount'] = request.amount
    
    if not updates:
        return EditRecordResponse(
            success=False,
            message="No fields provided to update"
        )
    
    # Update the record
    success = handler.update_record(request.record_id, updates, request.session_id)
    
    if success:
        # Fetch the updated record to return it
        records_response = handler.get_records(None, request.session_id)
        records = records_response.get('records', [])
        
        # Find the updated record
        updated_record = None
        for record in records:
            if record[0] == request.record_id:
                updated_record = TransactionRecord(
                    id=record[0],
                    bank=record[1],
                    date=record[2],
                    description=record[3],
                    amount=record[4],
                    category=record[5]
                )
                break
        
        return EditRecordResponse(
            success=True,
            message="Record updated successfully",
            updated_record=updated_record
        )
    else:
        return EditRecordResponse(
            success=False,
            message="Failed to update record. Record may not exist or belong to this session."
        )

@app.post("/clear/", response_model=ClearResponse, tags=["Records"])
@handle_api_errors("RECORDS_CLEARING")
async def clear_records(session_id: str = Form(...)):
    """
    Endpoint to clear all records from the bank_statements table.
    """
    result = handler.clear_records(session_id)
    return ClearResponse(
        message=result.get('message', 'Successfully cleared records'),
        records_deleted=result.get('records_deleted', 0)
    )
