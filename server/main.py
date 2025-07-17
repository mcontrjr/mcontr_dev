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

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
handler = PostgresHandler()


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "FastAPI for mcontr.dev",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "categories": "/categories/",
            "records": "/records/",
            "parse": "/parse/",
            "system-info": "/system-info/",
            "clear": "/clear/",
            "docs": "/docs"
        }
    }


@app.get("/categories/")
async def get_categories() -> dict:
    """
    Retrieve categories from parser. The categories contain keyword strings that map back to it
    so if any keywords are found in the description we can defer the category.

    ex: {
    'GAS': {'GAS', 'CHEVRON', 'SHELL'}
    ...
    }
    :return: hashmap of categories and keywords
    """
    try:
        categories = Parser.keyword_to_category
        return categories
    except Exception as e:
        log.error(f"Error retrieving records from database: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving records from database.")

@app.get("/records/")
async def get_records(bank_name: Optional[str] = Query(None), session_id: str = Query(...)) -> dict:
    """
    Retrieve records from the database, optionally filtering by bank name.
    
    :param bank_name: Optional; filter results by the bank name.
    :return: List of records matching the criteria.
    """
    if bank_name is None:
        bank_name = ""
        log.info("No bank name passed in query. Returning all records...")
    bank_name = bank_name.upper()
    records = []
    try:
        response = handler.get_records(bank_name, session_id)
        records = response.get('records', [])
        
        results = []
        for record in records:
            results.append({
                'id': record[0],
                'bank': record[1],
                'date': record[2],
                'description': record[3],
                'amount': record[4],
                'category': record[5]
            })
        resp = {
            'records': results,
            'count': len(results)
        }
        return resp

    except Exception as e:
        log.error(f"Error retrieving records from database: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving records from database.")

@app.post("/parse/")
async def parse_upload_file(pdf_files: List[UploadFile] = File(...), session_id: str = Form(...)):
    """
    Endpoint to upload and parse PDF files.
    """
    try:
        log.info(f"Received {len(pdf_files)} files: {[file.filename for file in pdf_files]}")
        
        # Save the uploaded file
        os.makedirs("./uploads", exist_ok=True)
        
        for pdf_file in pdf_files:
            log.info(f"Processing pdf file: {pdf_file.filename}")
            
            # Save the uploaded file
            pdf_path = f"./uploads/{pdf_file.filename}"
            with open(pdf_path, "wb") as buffer:
                shutil.copyfileobj(pdf_file.file, buffer)
            
            # Process each PDF file
            statement = Parser(pdf_path)
            handler.save_to_database(statement.purchases, session_id)
            
        return {"status": "success", "message": "File processed and data saved to database"}
    except Exception as e:
        log.error(f"Error processing PDF files: {e}")
        raise HTTPException(status_code=500, detail="Error processing PDF files")

@app.get("/system-info/")
async def get_system_info():
    """
    Endpoint to retrieve system information including CPU, memory, threads, and platform details.
    """
    try:
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
        
        return {
            "cpu": cpu_info,
            "memory": memory_info,
            "threads": thread_info,
            "platform": platform_info,
            "disk": disk_info,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        log.error(f"Error retrieving system information: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving system information")

@app.post("/clear/")
async def clear_records(session_id: str = Form(...)):
    """
    Endpoint to clear all records from the bank_statements table.
    """
    try:
        return handler.clear_records(session_id)
    except Exception as e:
        log.error(f"Error clearing records from database: {e}")
        raise HTTPException(status_code=500, detail="Error clearing records from database.")