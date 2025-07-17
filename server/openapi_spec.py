"""
Generate comprehensive OpenAPI specification for the Financial Statement Processing API.
"""

import json
from typing import Dict, Any

# Define comprehensive OpenAPI specification
OPENAPI_SPEC = {
    "openapi": "3.0.0",
    "info": {
        "title": "Financial Statement Processing API",
        "version": "1.0.0",
        "description": """
A comprehensive FastAPI backend service for processing PDF bank statements, extracting financial transactions, 
and providing data visualization and analysis capabilities with session-based data isolation.

## Key Features
- Multi-bank PDF processing (American Express, Citi, Discover)
- Session-based data isolation for multi-user support
- Automated transaction categorization
- Data visualization and plotting
- System monitoring and health checks
- Comprehensive error handling

## Session Management
Session IDs are required for all data operations to ensure complete data isolation between users. 
Generate a UUID4 string for each user session and include it in all API calls.

## Supported Banks
- **American Express**: PDF statement processing with transaction tables
- **Citi**: Statement PDF with transaction details and amount extraction
- **Discover**: PDF statement processing with categorization

## Authentication
This API currently uses session-based isolation without authentication. 
In production, implement proper authentication and authorization.
        """,
        "contact": {
            "name": "API Support",
            "email": "support@example.com"
        },
        "license": {
            "name": "MIT License",
            "url": "https://opensource.org/licenses/MIT"
        }
    },
    "servers": [
        {
            "url": "http://localhost:8000",
            "description": "Development server"
        },
        {
            "url": "https://api.example.com",
            "description": "Production server"
        }
    ],
    "paths": {
        "/categories/": {
            "get": {
                "summary": "Get Transaction Categories",
                "description": """
Retrieve the category mapping used for transaction classification. 
Returns a dictionary where keys are category names and values are lists of keywords 
that trigger classification into that category.

This endpoint is useful for:
- Understanding available transaction categories
- Implementing client-side filtering
- Displaying category information to users
                """,
                "operationId": "get_categories",
                "tags": ["Categories"],
                "responses": {
                    "200": {
                        "description": "Category mapping retrieved successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/CategoriesResponse"
                                },
                                "example": {
                                    "FOOD": ["STARBUCKS", "RESTAURANT", "GROCERY", "MCDONALDS"],
                                    "GAS": ["SHELL", "CHEVRON", "EXXON", "MOBIL"],
                                    "SHOPPING": ["AMAZON", "TARGET", "WALMART", "COSTCO"],
                                    "ENTERTAINMENT": ["NETFLIX", "SPOTIFY", "THEATER", "MOVIE"],
                                    "UTILITIES": ["ELECTRIC", "WATER", "GAS", "INTERNET"],
                                    "TRANSPORT": ["UBER", "LYFT", "TAXI", "PARKING"],
                                    "HEALTHCARE": ["PHARMACY", "DOCTOR", "HOSPITAL", "MEDICAL"],
                                    "OTHER": ["ATM", "TRANSFER", "PAYMENT", "FEE"]
                                }
                            }
                        }
                    },
                    "500": {
                        "description": "Internal server error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ErrorResponse"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/records/": {
            "get": {
                "summary": "Get Financial Records",
                "description": """
Retrieve financial records from the database with optional filtering by bank name.
All records are isolated by session ID to ensure data privacy.

Use cases:
- Display all transactions for a user
- Filter transactions by specific bank
- Analyze spending patterns
- Generate reports
                """,
                "operationId": "get_records",
                "tags": ["Records"],
                "parameters": [
                    {
                        "name": "session_id",
                        "in": "query",
                        "required": True,
                        "description": "Session identifier for data isolation (UUID4 format recommended)",
                        "schema": {
                            "type": "string",
                            "format": "uuid",
                            "example": "550e8400-e29b-41d4-a716-446655440000"
                        }
                    },
                    {
                        "name": "bank_name",
                        "in": "query",
                        "required": False,
                        "description": "Filter records by bank name (case insensitive)",
                        "schema": {
                            "type": "string",
                            "enum": ["AMEX", "CITI", "DISCOVER"],
                            "example": "AMEX"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Records retrieved successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/RecordsResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation error - session_id is required",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ValidationError"
                                }
                            }
                        }
                    },
                    "500": {
                        "description": "Database error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ErrorResponse"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/parse/": {
            "post": {
                "summary": "Parse PDF Bank Statements",
                "description": """
Upload and parse PDF bank statements to extract transaction data. 
Supports multiple files in a single request. Each file is processed individually
and transactions are saved to the database with the provided session ID.

Supported file formats:
- PDF files from American Express, Citi, or Discover
- Multiple files can be uploaded simultaneously
- Files are automatically detected for bank type

Processing workflow:
1. Files are uploaded to server storage
2. Bank type is automatically detected
3. PDF content is parsed for transactions
4. Transactions are categorized automatically
5. Data is saved to database with session isolation
                """,
                "operationId": "parse_pdf_files",
                "tags": ["Processing"],
                "requestBody": {
                    "required": True,
                    "content": {
                        "multipart/form-data": {
                            "schema": {
                                "type": "object",
                                "required": ["pdf_files", "session_id"],
                                "properties": {
                                    "pdf_files": {
                                        "type": "array",
                                        "items": {
                                            "type": "string",
                                            "format": "binary"
                                        },
                                        "description": "PDF files to process (supports multiple files)"
                                    },
                                    "session_id": {
                                        "type": "string",
                                        "format": "uuid",
                                        "description": "Session identifier for data isolation",
                                        "example": "550e8400-e29b-41d4-a716-446655440000"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Files processed successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ParseResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "description": "Invalid file format or processing error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ErrorResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation error - missing required fields",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ValidationError"
                                }
                            }
                        }
                    },
                    "500": {
                        "description": "Processing or database error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ErrorResponse"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/plot/": {
            "get": {
                "summary": "Generate Financial Data Visualization",
                "description": """
Generate a PNG plot visualization of financial data for a specific month and optional bank filter.
The plot shows spending by category with color-coded bars and includes a legend.

Features:
- Monthly data filtering
- Optional bank filtering
- Category-based color coding
- Automatic legend generation
- PNG image output

Note: This endpoint currently uses 'legacy-session' for backward compatibility.
Future versions will require session_id parameter.
                """,
                "operationId": "generate_plot",
                "tags": ["Visualization"],
                "parameters": [
                    {
                        "name": "month",
                        "in": "query",
                        "required": True,
                        "description": "Month to filter data (supports various formats: YYYY-MM, MM, month name)",
                        "schema": {
                            "type": "string",
                            "pattern": "^(\\d{4}-\\d{1,2}|\\d{1,2}|[a-zA-Z]+)$",
                            "example": "2025-01"
                        }
                    },
                    {
                        "name": "bank",
                        "in": "query",
                        "required": False,
                        "description": "Filter by specific bank (case insensitive)",
                        "schema": {
                            "type": "string",
                            "enum": ["AMEX", "CITI", "DISCOVER"],
                            "example": "AMEX"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Plot generated successfully",
                        "content": {
                            "image/png": {
                                "schema": {
                                    "type": "string",
                                    "format": "binary"
                                }
                            }
                        }
                    },
                    "400": {
                        "description": "Invalid month format",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ErrorResponse"
                                }
                            }
                        }
                    },
                    "404": {
                        "description": "No data found for the specified criteria",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ErrorResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation error - month is required",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ValidationError"
                                }
                            }
                        }
                    },
                    "500": {
                        "description": "Plot generation error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ErrorResponse"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/system-info/": {
            "get": {
                "summary": "Get System Information",
                "description": """
Retrieve comprehensive system information including CPU usage, memory statistics, 
disk usage, thread count, and platform details. Useful for monitoring and diagnostics.

Information included:
- CPU: usage percentage, core count, frequency
- Memory: total, available, used, percentage
- Disk: total, used, free, percentage
- Threads: active count, current thread name
- Platform: OS, version, architecture, Python version
                """,
                "operationId": "get_system_info",
                "tags": ["System"],
                "responses": {
                    "200": {
                        "description": "System information retrieved successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/SystemInfoResponse"
                                }
                            }
                        }
                    },
                    "500": {
                        "description": "Error retrieving system information",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ErrorResponse"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/clear/": {
            "post": {
                "summary": "Clear Session Records",
                "description": """
Clear all financial records associated with a specific session ID. 
This operation is irreversible and will permanently delete all transaction data 
for the specified session.

Use cases:
- Reset user data
- Clean up test data
- User-initiated data deletion
- Session cleanup

⚠️ **Warning**: This operation cannot be undone. All transaction data for the 
specified session will be permanently deleted.
                """,
                "operationId": "clear_records",
                "tags": ["Records"],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/x-www-form-urlencoded": {
                            "schema": {
                                "type": "object",
                                "required": ["session_id"],
                                "properties": {
                                    "session_id": {
                                        "type": "string",
                                        "format": "uuid",
                                        "description": "Session identifier for data isolation",
                                        "example": "550e8400-e29b-41d4-a716-446655440000"
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Records cleared successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ClearResponse"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation error - session_id is required",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ValidationError"
                                }
                            }
                        }
                    },
                    "500": {
                        "description": "Database error",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ErrorResponse"
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    "components": {
        "schemas": {
            "TransactionRecord": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "integer",
                        "description": "Unique transaction identifier"
                    },
                    "bank": {
                        "type": "string",
                        "enum": ["AMEX", "CITI", "DISCOVER"],
                        "description": "Bank name"
                    },
                    "date": {
                        "type": "string",
                        "format": "date",
                        "description": "Transaction date"
                    },
                    "description": {
                        "type": "string",
                        "description": "Transaction description/merchant name"
                    },
                    "amount": {
                        "type": "number",
                        "format": "float",
                        "description": "Transaction amount (negative for expenses, positive for credits)"
                    },
                    "category": {
                        "type": "string",
                        "description": "Automatically assigned category"
                    }
                },
                "required": ["id", "bank", "date", "description", "amount", "category"],
                "example": {
                    "id": 1,
                    "bank": "AMEX",
                    "date": "2025-01-15",
                    "description": "STARBUCKS STORE #12345",
                    "amount": -4.95,
                    "category": "FOOD"
                }
            },
            "CategoriesResponse": {
                "type": "object",
                "additionalProperties": {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                },
                "description": "Category mapping with keywords",
                "example": {
                    "FOOD": ["STARBUCKS", "RESTAURANT", "GROCERY"],
                    "GAS": ["SHELL", "CHEVRON", "EXXON"],
                    "SHOPPING": ["AMAZON", "TARGET", "WALMART"]
                }
            },
            "RecordsResponse": {
                "type": "object",
                "properties": {
                    "records": {
                        "type": "array",
                        "items": {
                            "$ref": "#/components/schemas/TransactionRecord"
                        }
                    },
                    "count": {
                        "type": "integer",
                        "description": "Total number of records returned"
                    }
                },
                "required": ["records", "count"],
                "example": {
                    "records": [
                        {
                            "id": 1,
                            "bank": "AMEX",
                            "date": "2025-01-15",
                            "description": "STARBUCKS STORE #12345",
                            "amount": -4.95,
                            "category": "FOOD"
                        }
                    ],
                    "count": 1
                }
            },
            "ParseResponse": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["success", "error"],
                        "description": "Processing status"
                    },
                    "message": {
                        "type": "string",
                        "description": "Processing result message"
                    },
                    "files_processed": {
                        "type": "integer",
                        "description": "Number of files successfully processed"
                    },
                    "transactions_added": {
                        "type": "integer",
                        "description": "Number of transactions added to database"
                    }
                },
                "required": ["status", "message"],
                "example": {
                    "status": "success",
                    "message": "Files processed and data saved to database",
                    "files_processed": 2,
                    "transactions_added": 45
                }
            },
            "ClearResponse": {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "Success message"
                    },
                    "records_deleted": {
                        "type": "integer",
                        "description": "Number of records deleted"
                    }
                },
                "required": ["message", "records_deleted"],
                "example": {
                    "message": "Successfully cleared all records",
                    "records_deleted": 123
                }
            },
            "SystemInfoResponse": {
                "type": "object",
                "properties": {
                    "cpu": {
                        "type": "object",
                        "properties": {
                            "cpu_count": {"type": "integer"},
                            "cpu_count_logical": {"type": "integer"},
                            "cpu_percent": {"type": "number"},
                            "cpu_freq": {
                                "type": "object",
                                "properties": {
                                    "current": {"type": "number"},
                                    "min": {"type": "number"},
                                    "max": {"type": "number"}
                                }
                            }
                        }
                    },
                    "memory": {
                        "type": "object",
                        "properties": {
                            "total": {"type": "integer"},
                            "available": {"type": "integer"},
                            "percent": {"type": "number"},
                            "used": {"type": "integer"},
                            "free": {"type": "integer"}
                        }
                    },
                    "disk": {
                        "type": "object",
                        "properties": {
                            "total": {"type": "integer"},
                            "used": {"type": "integer"},
                            "free": {"type": "integer"},
                            "percent": {"type": "number"}
                        }
                    },
                    "threads": {
                        "type": "object",
                        "properties": {
                            "active_threads": {"type": "integer"},
                            "current_thread": {"type": "string"}
                        }
                    },
                    "platform": {
                        "type": "object",
                        "properties": {
                            "system": {"type": "string"},
                            "node": {"type": "string"},
                            "release": {"type": "string"},
                            "version": {"type": "string"},
                            "machine": {"type": "string"},
                            "processor": {"type": "string"},
                            "python_version": {"type": "string"}
                        }
                    },
                    "timestamp": {
                        "type": "string",
                        "format": "date-time"
                    }
                },
                "required": ["cpu", "memory", "disk", "threads", "platform", "timestamp"]
            },
            "ErrorResponse": {
                "type": "object",
                "properties": {
                    "detail": {
                        "type": "string",
                        "description": "Error message"
                    }
                },
                "required": ["detail"],
                "example": {
                    "detail": "Database connection failed"
                }
            },
            "ValidationError": {
                "type": "object",
                "properties": {
                    "detail": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "loc": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                },
                                "msg": {"type": "string"},
                                "type": {"type": "string"}
                            }
                        }
                    }
                },
                "example": {
                    "detail": [
                        {
                            "loc": ["query", "session_id"],
                            "msg": "field required",
                            "type": "value_error.missing"
                        }
                    ]
                }
            }
        },
        "securitySchemes": {
            "sessionId": {
                "type": "apiKey",
                "in": "query",
                "name": "session_id",
                "description": "Session identifier for data isolation (UUID4 format recommended)"
            }
        }
    },
    "tags": [
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
            "name": "Visualization",
            "description": "Data visualization and plotting"
        },
        {
            "name": "System",
            "description": "System monitoring and diagnostics"
        }
    ],
    "externalDocs": {
        "description": "Find more information about the Financial Statement Processing API",
        "url": "https://github.com/example/financial-api"
    }
}

def save_openapi_spec(file_path: str = "openapi.json"):
    """Save the OpenAPI specification to a JSON file."""
    with open(file_path, 'w') as f:
        json.dump(OPENAPI_SPEC, f, indent=2)
    print(f"OpenAPI specification saved to {file_path}")

def get_openapi_spec() -> Dict[str, Any]:
    """Get the OpenAPI specification as a dictionary."""
    return OPENAPI_SPEC

if __name__ == "__main__":
    # Generate the OpenAPI specification file
    save_openapi_spec("openapi.json")
    
    # Also save a YAML version for better readability
    try:
        import yaml
        with open("openapi.yaml", 'w') as f:
            yaml.dump(OPENAPI_SPEC, f, default_flow_style=False, sort_keys=False)
        print("OpenAPI specification saved to openapi.yaml")
    except ImportError:
        print("PyYAML not installed, skipping YAML output")