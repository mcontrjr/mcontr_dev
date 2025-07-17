# Financial Statement Processing Backend

A FastAPI-based backend service for processing PDF bank statements, extracting financial transactions, and providing data visualization and analysis capabilities.

## Overview

This backend service provides a comprehensive solution for financial statement processing with multi-bank support, session-based data isolation, and automated transaction categorization. It's designed to handle multiple users simultaneously while maintaining data privacy and security.

## Key Features

- **Multi-Bank PDF Processing**: Supports American Express, Citi, and Discover bank statements
- **Session-Based Data Isolation**: Each user session maintains separate data contexts
- **Automated Transaction Categorization**: Intelligent classification of transactions by category
- **Data Visualization**: Built-in plotting capabilities for financial data analysis
- **Real-time System Monitoring**: Health checks and system resource monitoring
- **Comprehensive API**: RESTful endpoints for all operations

## Architecture

- **Framework**: FastAPI with Python 3.11+
- **Database**: PostgreSQL with session-based isolation
- **PDF Processing**: PyPDF library for statement parsing
- **Visualization**: Matplotlib for chart generation
- **Testing**: Pytest with comprehensive coverage
- **Deployment**: Docker containerization ready

## API Endpoints

### Core Routes

#### `GET /categories/`
**Purpose**: Retrieve category mapping for transaction classification
- **Parameters**: None
- **Returns**: JSON object with categories and associated keywords
- **Use Case**: Get available categories for transaction classification and filtering
- **Example Response**:
```json
{
  "FOOD": ["STARBUCKS", "RESTAURANT", "GROCERY"],
  "GAS": ["SHELL", "CHEVRON", "EXXON"],
  "SHOPPING": ["AMAZON", "TARGET", "WALMART"]
}
```

#### `GET /records/`
**Purpose**: Retrieve financial records with filtering capabilities
- **Parameters**: 
  - `session_id` (required): Session identifier for data isolation
  - `bank_name` (optional): Filter by specific bank
- **Returns**: JSON with records array and count
- **Use Case**: View all transactions or filter by bank for analysis
- **Example**: `GET /records/?session_id=abc123&bank_name=AMEX`

#### `POST /parse/`
**Purpose**: Upload and parse PDF bank statements
- **Parameters**: 
  - `pdf_files`: List of PDF files to upload
  - `session_id` (required): Session identifier
- **Returns**: Processing status and file count
- **Use Case**: Process new bank statements and extract transaction data
- **Supported Banks**: American Express, Citi, Discover
- **File Storage**: Uploads saved to `/uploads/` directory

#### `GET /plot/`
**Purpose**: Generate visualization plots for financial data
- **Parameters**: 
  - `month` (required): Month for data filtering (YYYY-MM format)
  - `bank` (optional): Filter by specific bank
- **Returns**: PNG image stream
- **Use Case**: Create visual reports of spending patterns by category
- **Example**: `GET /plot/?month=2025-01&bank=AMEX`

#### `GET /system-info/`
**Purpose**: System monitoring and health diagnostics
- **Parameters**: None
- **Returns**: JSON with system metrics (CPU, memory, disk, threads, platform)
- **Use Case**: Monitor system health and performance
- **Example Response**:
```json
{
  "cpu": {"usage_percent": 25.5},
  "memory": {"total_bytes": 8000000000, "percent": 50.0},
  "disk": {"percent": 45.0},
  "threads": {"active_count": 8},
  "platform": {"system": "Linux", "version": "5.4.0"}
}
```

#### `POST /clear/`
**Purpose**: Clear all records for a specific session
- **Parameters**: 
  - `session_id` (required): Session identifier
- **Returns**: Success message with count of deleted records
- **Use Case**: Reset session data or clean up test data
- **Example**: `POST /clear/` with `session_id=abc123`

## Session ID Architecture

### Why Session IDs Are Required

Session IDs are a core architectural component that enables:

1. **Data Isolation**: Multiple users can use the system simultaneously without data conflicts
2. **Privacy Protection**: Each user's financial data remains completely separate
3. **Concurrent Processing**: Multiple PDF uploads and analyses can run in parallel
4. **Scalability**: System can handle many users without performance degradation

### Session ID Implementation

- **Format**: UUID4 strings (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- **Scope**: Required for all data operations (`/records/`, `/parse/`, `/clear/`)
- **Storage**: Stored with each transaction record in the database
- **Legacy Support**: Default session `legacy-session` for backward compatibility

### Usage Pattern

```python
import uuid

# Generate session ID for new user
session_id = str(uuid.uuid4())

# All subsequent API calls use this session_id
response = requests.get(f"/records/?session_id={session_id}")
```

## Database Schema

```sql
CREATE TABLE bank_statements (
    id SERIAL PRIMARY KEY,
    bank VARCHAR(255),
    date DATE,
    description TEXT,
    amount DECIMAL(10, 2),
    category VARCHAR(255),
    session_id VARCHAR(36) NOT NULL DEFAULT 'legacy-session'
);
```

## Transaction Processing Flow

1. **Upload**: User uploads PDF files via `/parse/` endpoint
2. **Detection**: System automatically detects bank type (AMEX, Citi, Discover)
3. **Parsing**: PDF content is extracted and transaction data is parsed
4. **Categorization**: Transactions are automatically categorized using keyword matching
5. **Storage**: Data is stored in PostgreSQL with session isolation
6. **Retrieval**: Users can query their data via `/records/` endpoint
7. **Visualization**: Generate plots via `/plot/` endpoint for data analysis

## Supported Bank Formats

### American Express
- PDF format with transaction tables
- Date parsing for various formats
- Category classification based on merchant names

### Citi
- Statement PDF with transaction details
- Amount extraction with proper sign handling
- Merchant name normalization

### Discover
- PDF statement processing
- Transaction categorization
- Date and amount parsing

## Error Handling

The API provides comprehensive error handling:

- **422 Validation Error**: Missing or invalid parameters
- **400 Bad Request**: Invalid file format or data
- **404 Not Found**: No data found for requested criteria
- **500 Internal Server Error**: Database or processing errors

## Testing

Comprehensive test suite with:

- **Unit Tests**: Mock-based testing of all components
- **Integration Tests**: Real HTTP endpoint testing
- **API Coverage**: All routes tested with various scenarios
- **Database Tests**: Session isolation and data integrity
- **Error Handling**: Edge cases and error conditions

### Running Tests

```bash
# Install dependencies
pip install -r requirements.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov=main --cov-report=html

# Run specific test categories
pytest -m unit          # Unit tests only
pytest -m integration   # Integration tests only
pytest -m api          # API endpoint tests only
```

## Development Setup

1. **Database**: PostgreSQL instance with connection details in environment
2. **Dependencies**: Install from `requirements.txt`
3. **Configuration**: Environment variables for database connection
4. **Running**: `uvicorn main:app --reload` for development

## Production Deployment

- **Docker**: Containerized deployment with Dockerfile
- **ASGI Server**: Uvicorn for production-ready async handling
- **Health Checks**: Built-in monitoring endpoints
- **Logging**: Structured logging to files and console
- **Security**: CORS configuration and secure file handling

## API Documentation

- **Interactive Docs**: Available at `/docs` when server is running
- **OpenAPI Spec**: Available at `/openapi.json`
- **Redoc**: Alternative documentation at `/redoc`

## Performance Considerations

- **Session Isolation**: Minimal performance impact with proper indexing
- **File Storage**: Efficient PDF processing with temporary file handling
- **Memory Usage**: Optimized for handling multiple concurrent uploads
- **Database Queries**: Indexed session_id for fast data retrieval

## Security Features

- **Session Isolation**: Complete data separation between users
- **SQL Injection Prevention**: Parameterized queries throughout
- **File Upload Security**: Proper file type validation and storage
- **Error Information**: Minimal error disclosure to prevent information leakage

## Monitoring and Diagnostics

- **System Info**: Real-time system resource monitoring
- **Health Checks**: Built-in endpoints for load balancer integration
- **Logging**: Comprehensive logging with log levels
- **Performance Metrics**: Response time and resource usage tracking

This backend provides a robust, scalable solution for financial statement processing with enterprise-grade session management and comprehensive API coverage.