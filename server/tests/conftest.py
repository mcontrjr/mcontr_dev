"""
Shared pytest fixtures and configuration for all tests.
"""

import pytest
import uuid
import tempfile
import os
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from main import app


@pytest.fixture(scope="session")
def test_client():
    """Create a test client for the FastAPI app that persists across test session."""
    return TestClient(app)


@pytest.fixture
def client():
    """Create a test client for the FastAPI app for individual tests."""
    return TestClient(app)


@pytest.fixture
def session_id():
    """Generate a unique session ID for testing."""
    return str(uuid.uuid4())


@pytest.fixture
def session_ids():
    """Generate multiple unique session IDs for testing."""
    return {
        'session_1': str(uuid.uuid4()),
        'session_2': str(uuid.uuid4()),
        'session_3': str(uuid.uuid4())
    }


@pytest.fixture
def sample_pdf_content():
    """Sample PDF content for testing file uploads."""
    return b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n%%EOF"


@pytest.fixture
def sample_records():
    """Sample financial records for testing."""
    return [
        {
            'id': 1,
            'bank': 'AMEX',
            'date': '2025-01-01',
            'description': 'STARBUCKS COFFEE',
            'amount': -15.50,
            'category': 'FOOD'
        },
        {
            'id': 2,
            'bank': 'CITI',
            'date': '2025-01-02',
            'description': 'SHELL GAS STATION',
            'amount': -45.00,
            'category': 'GAS'
        },
        {
            'id': 3,
            'bank': 'DISCOVER',
            'date': '2025-01-03',
            'description': 'AMAZON PURCHASE',
            'amount': -89.99,
            'category': 'SHOPPING'
        }
    ]


@pytest.fixture
def sample_purchases():
    """Sample purchase data from parser for testing."""
    return [
        {
            'Bank': 'AMEX',
            'Date': '2025-01-01',
            'Description': 'STARBUCKS COFFEE',
            'Amount': -15.50,
            'Category': 'FOOD'
        },
        {
            'Bank': 'CITI',
            'Date': '2025-01-02',
            'Description': 'SHELL GAS STATION',
            'Amount': -45.00,
            'Category': 'GAS'
        }
    ]


@pytest.fixture
def mock_handler():
    """Mock the PostgresHandler to avoid actual database operations."""
    with patch('main.handler') as mock:
        # Set up default return values
        mock.get_records.return_value = {'records': [], 'count': 0}
        mock.clear_records.return_value = {
            'message': 'Successfully cleared all records',
            'records_deleted': 0
        }
        mock.save_to_database.return_value = None
        yield mock


@pytest.fixture
def mock_parser():
    """Mock the Parser class to avoid actual PDF parsing."""
    with patch('main.Parser') as mock:
        mock_instance = MagicMock()
        mock_instance.purchases = []
        mock.return_value = mock_instance
        yield mock


@pytest.fixture
def mock_file_operations():
    """Mock file operations to avoid actual file I/O."""
    with patch('main.os.makedirs') as mock_makedirs, \
         patch('main.open') as mock_open, \
         patch('main.shutil.copyfileobj') as mock_copyfile:
        
        yield {
            'makedirs': mock_makedirs,
            'open': mock_open,
            'copyfileobj': mock_copyfile
        }


@pytest.fixture
def mock_psutil():
    """Mock psutil for system info tests."""
    with patch('main.psutil') as mock:
        # Set up realistic system info
        mock.cpu_percent.return_value = 25.5
        mock.virtual_memory.return_value = MagicMock(
            total=8000000000,
            available=4000000000,
            percent=50.0
        )
        mock.disk_usage.return_value = MagicMock(
            total=100000000000,
            used=50000000000,
            free=50000000000,
            percent=50.0
        )
        yield mock


@pytest.fixture
def mock_platform():
    """Mock platform information."""
    with patch('main.threading.active_count', return_value=5), \
         patch('main.platform.system', return_value='Linux'), \
         patch('main.platform.release', return_value='5.4.0'), \
         patch('main.platform.machine', return_value='x86_64'):
        yield


@pytest.fixture
def temp_upload_dir():
    """Create a temporary directory for upload tests."""
    with tempfile.TemporaryDirectory() as temp_dir:
        upload_dir = os.path.join(temp_dir, 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        with patch('main.UPLOAD_DIR', upload_dir):
            yield upload_dir


@pytest.fixture
def valid_pdf_file():
    """Create a valid PDF file for testing."""
    pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
179
%%EOF"""
    return pdf_content


@pytest.fixture(autouse=True)
def reset_mocks():
    """Reset all mocks between tests."""
    yield
    # Any cleanup can go here


# Test configuration
def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "unit: Unit tests with mocks (default)"
    )
    config.addinivalue_line(
        "markers", "integration: Integration tests requiring running server"
    )
    config.addinivalue_line(
        "markers", "slow: Slow running tests"
    )
    config.addinivalue_line(
        "markers", "api: API endpoint tests"
    )
    config.addinivalue_line(
        "markers", "parser: Parser functionality tests"
    )
    config.addinivalue_line(
        "markers", "database: Database interaction tests"
    )


# Custom test collection
def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers automatically."""
    for item in items:
        # Add 'unit' marker to all tests by default
        if not any(marker.name in ['integration', 'slow'] for marker in item.iter_markers()):
            item.add_marker(pytest.mark.unit)
        
        # Add 'api' marker to API tests
        if 'test_api' in item.nodeid or 'TestApi' in item.nodeid:
            item.add_marker(pytest.mark.api)
        
        # Add 'parser' marker to parser tests
        if 'test_parser' in item.nodeid or 'TestParser' in item.nodeid:
            item.add_marker(pytest.mark.parser)
        
        # Add 'database' marker to database tests
        if 'test_database' in item.nodeid or 'TestDatabase' in item.nodeid:
            item.add_marker(pytest.mark.database)