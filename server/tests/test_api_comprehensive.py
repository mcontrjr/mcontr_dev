"""
Comprehensive API tests for all routes with full coverage and validation.
Tests all endpoints, error conditions, edge cases, and session isolation.
"""

import pytest
import uuid
from datetime import date
from unittest.mock import patch, MagicMock, mock_open
from fastapi.testclient import TestClient

from main import app
from src.models import TransactionRecord, ClearResponse, SessionIncomeResponse


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def session_id():
    """Generate a unique session ID for testing."""
    return str(uuid.uuid4())


@pytest.fixture
def mock_handler():
    """Mock the PostgresHandler to avoid actual database operations."""
    with patch('main.handler') as mock:
        yield mock


@pytest.fixture
def mock_parser():
    """Mock the Parser to avoid actual PDF parsing."""
    with patch('main.Parser') as mock:
        yield mock


@pytest.fixture
def sample_pdf_content():
    """Sample PDF content for testing file uploads."""
    return b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n%%EOF"


@pytest.fixture
def mock_transaction_records():
    """Sample TransactionRecord objects returned by handler."""
    return [
        TransactionRecord(id=1, bank='AMEX', date=date(2025, 1, 1), description='STARBUCKS COFFEE', amount=15.50, category='FOOD'),
        TransactionRecord(id=2, bank='CITI', date=date(2025, 1, 2), description='SHELL GAS STATION', amount=45.00, category='GAS'),
    ]


@pytest.mark.unit
class TestCategoriesEndpoint:
    """Test the /categories/ endpoint."""

    def test_categories_get_success(self, client):
        """Test successful retrieval of categories."""
        response = client.get("/categories/")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, dict)

        # Check that expected categories exist (based on actual parser categories)
        assert 'categories' in data
        categories = data['categories']
        expected_categories = ['FOOD', 'GAS', 'TRAVEL', 'AMAZON', 'STREAMING']
        for category in expected_categories:
            assert category in categories
            assert isinstance(categories[category], list)

    def test_categories_response_format(self, client):
        """Test that categories response has correct format."""
        response = client.get("/categories/")
        data = response.json()

        # Each category should have a list of keywords
        assert 'categories' in data
        categories = data['categories']
        for category, keywords in categories.items():
            assert isinstance(keywords, list)
            assert len(keywords) > 0
            for keyword in keywords:
                assert isinstance(keyword, str)

    def test_categories_no_parameters_needed(self, client):
        """Test that categories endpoint doesn't require parameters."""
        response = client.get("/categories/")
        assert response.status_code == 200

        # Should work with query parameters too (ignored)
        response = client.get("/categories/?random_param=value")
        assert response.status_code == 200


@pytest.mark.unit
class TestRecordsEndpoint:
    """Test the /records/ endpoint."""

    def test_records_post_success(self, client, session_id, mock_handler, mock_transaction_records):
        """Test successful retrieval of enriched records via POST with JSON body."""
        mock_handler.get_records.return_value = mock_transaction_records
        mock_handler.get_income.return_value = None

        response = client.post("/records/", json={"session_id": session_id})
        assert response.status_code == 200

        data = response.json()
        assert 'records' in data
        assert 'count' in data
        assert 'charts' in data
        assert 'metrics' in data
        assert 'availableBanks' in data
        assert 'availableMonths' in data
        assert data['count'] == 2
        assert len(data['records']) == 2

        # Verify record content
        assert data['records'][0]['bank'] == 'AMEX'
        assert data['records'][1]['bank'] == 'CITI'

        # Verify charts structure
        charts = data['charts']
        assert 'lineData' in charts
        assert 'pieData' in charts
        assert 'weeklyData' in charts

        # Verify metrics structure
        metrics = data['metrics']
        assert 'totalPurchases' in metrics
        assert 'totalPayments' in metrics
        assert 'transactionCount' in metrics

        # Verify handler was called with correct session_id
        mock_handler.get_records.assert_called_once_with("", session_id)

    def test_records_with_bank_filter(self, client, session_id, mock_handler):
        """Test records retrieval with bank filter."""
        filtered_records = [
            TransactionRecord(id=1, bank='AMEX', date=date(2025, 1, 1), description='STARBUCKS COFFEE', amount=15.50, category='FOOD'),
        ]
        mock_handler.get_records.return_value = filtered_records
        mock_handler.get_income.return_value = None

        response = client.post("/records/", json={"session_id": session_id, "bank_name": "AMEX"})
        assert response.status_code == 200

        data = response.json()
        assert data['count'] == 1
        assert data['records'][0]['bank'] == 'AMEX'

        # Verify handler was called with bank filter
        mock_handler.get_records.assert_called_once_with("AMEX", session_id)

    def test_records_with_month_filter(self, client, session_id, mock_handler, mock_transaction_records):
        """Test records retrieval with month filter."""
        mock_handler.get_records.return_value = mock_transaction_records
        mock_handler.get_income.return_value = None

        response = client.post("/records/", json={"session_id": session_id, "months": ["01"]})
        assert response.status_code == 200

        data = response.json()
        # Both records are in January, so both should be returned
        assert data['count'] == 2
        # Available months should include all months from unfiltered records
        assert '01' in data['availableMonths']

    def test_records_missing_session_id(self, client):
        """Test that records endpoint requires session_id."""
        response = client.post("/records/", json={})
        assert response.status_code == 422

        error_detail = response.json()
        assert 'detail' in error_detail


    def test_records_database_error(self, client, session_id, mock_handler):
        """Test records endpoint with database error."""
        mock_handler.get_records.side_effect = Exception("Database connection failed")

        response = client.post("/records/", json={"session_id": session_id})
        assert response.status_code == 500

        data = response.json()
        assert 'detail' in data
        assert 'Error retrieving records from database' in data['detail']

    def test_records_includes_monthly_income(self, client, session_id, mock_handler, mock_transaction_records):
        """Test that records response includes monthly_income when set."""
        mock_handler.get_records.return_value = mock_transaction_records
        mock_handler.get_income.return_value = 5000.0

        response = client.post("/records/", json={"session_id": session_id})
        assert response.status_code == 200
        data = response.json()
        assert data['monthly_income'] == 5000.0


@pytest.mark.unit
class TestParseEndpoint:
    """Test the /parse/ endpoint."""

    def test_parse_single_file_success(self, client, session_id, mock_handler, mock_parser, sample_pdf_content):
        """Test successful parsing of a single PDF file."""
        # Mock parser response
        mock_parser_instance = MagicMock()
        mock_parser_instance.purchases = [
            {
                'Bank': 'AMEX',
                'Date': '2025-01-01',
                'Description': 'STARBUCKS',
                'Amount': -15.50,
                'Category': 'FOOD'
            }
        ]
        mock_parser.return_value = mock_parser_instance

        # Mock file operations
        with patch('main.os.makedirs') as mock_makedirs, \
             patch('main.open', mock_open()) as mock_file, \
             patch('main.shutil.copyfileobj') as mock_copyfile:

            files = {"pdf_files": ("test.pdf", sample_pdf_content, "application/pdf")}
            data = {"session_id": session_id}

            response = client.post("/parse/", files=files, data=data)
            assert response.status_code == 200

            response_data = response.json()
            assert response_data['status'] == 'success'
            assert 'message' in response_data

            # Verify parser was called
            mock_parser.assert_called_once()
            mock_handler.save_to_database.assert_called_once()

    def test_parse_multiple_files_success(self, client, session_id, mock_handler, mock_parser, sample_pdf_content):
        """Test successful parsing of multiple PDF files."""
        mock_parser_instance = MagicMock()
        mock_parser_instance.purchases = [
            {
                'Bank': 'AMEX',
                'Date': '2025-01-01',
                'Description': 'STARBUCKS',
                'Amount': -15.50,
                'Category': 'FOOD'
            }
        ]
        mock_parser.return_value = mock_parser_instance

        with patch('main.os.makedirs'), \
             patch('main.open', mock_open()), \
             patch('main.shutil.copyfileobj'):

            files = [
                ("pdf_files", ("test1.pdf", sample_pdf_content, "application/pdf")),
                ("pdf_files", ("test2.pdf", sample_pdf_content, "application/pdf"))
            ]
            data = {"session_id": session_id}

            response = client.post("/parse/", files=files, data=data)
            assert response.status_code == 200

            response_data = response.json()
            assert response_data['status'] == 'success'

            # Verify parser was called for each file
            assert mock_parser.call_count == 2
            assert mock_handler.save_to_database.call_count == 2

    def test_parse_missing_session_id(self, client, sample_pdf_content):
        """Test that parse endpoint requires session_id."""
        files = {"pdf_files": ("test.pdf", sample_pdf_content, "application/pdf")}

        response = client.post("/parse/", files=files)
        assert response.status_code == 422

    def test_parse_missing_files(self, client, session_id):
        """Test parse endpoint with missing files."""
        data = {"session_id": session_id}

        response = client.post("/parse/", data=data)
        assert response.status_code == 422

    def test_parse_invalid_file_type(self, client, session_id, mock_parser):
        """Test parse endpoint with invalid file type."""
        # The endpoint now validates file types before processing
        files = {"pdf_files": ("test.txt", b"not a pdf", "text/plain")}
        data = {"session_id": session_id}

        response = client.post("/parse/", files=files, data=data)
        assert response.status_code == 400

        response_data = response.json()
        assert 'detail' in response_data
        assert 'must be a PDF file' in response_data['detail']

    def test_parse_parser_error(self, client, session_id, mock_parser, sample_pdf_content):
        """Test parse endpoint with parser error."""
        mock_parser.side_effect = Exception("Parser failed")

        with patch('main.os.makedirs'), \
             patch('main.open', mock_open()), \
             patch('main.shutil.copyfileobj'):

            files = {"pdf_files": ("test.pdf", sample_pdf_content, "application/pdf")}
            data = {"session_id": session_id}

            response = client.post("/parse/", files=files, data=data)
            assert response.status_code == 500

            response_data = response.json()
            assert 'detail' in response_data
            assert 'Error processing PDF files' in response_data['detail']

    def test_parse_database_error(self, client, session_id, mock_handler, mock_parser, sample_pdf_content):
        """Test parse endpoint with database error."""
        mock_parser_instance = MagicMock()
        mock_parser_instance.purchases = [{'Bank': 'TEST'}]
        mock_parser.return_value = mock_parser_instance

        mock_handler.save_to_database.side_effect = Exception("Database error")

        with patch('main.os.makedirs'), \
             patch('main.open', mock_open()), \
             patch('main.shutil.copyfileobj'):

            files = {"pdf_files": ("test.pdf", sample_pdf_content, "application/pdf")}
            data = {"session_id": session_id}

            response = client.post("/parse/", files=files, data=data)
            assert response.status_code == 500


@pytest.mark.unit
class TestSystemInfoEndpoint:
    """Test the /system-info/ endpoint."""

    def test_system_info_success(self, client):
        """Test successful system info retrieval."""
        with patch('main.psutil') as mock_psutil:
            # Mock psutil responses
            mock_psutil.cpu_percent.return_value = 25.5
            mock_psutil.virtual_memory.return_value = MagicMock(
                total=8000000000,
                available=4000000000,
                percent=50.0
            )
            mock_psutil.disk_usage.return_value = MagicMock(
                total=100000000000,
                used=50000000000,
                free=50000000000,
                percent=50.0
            )

            with patch('main.threading.active_count', return_value=5), \
                 patch('main.platform.system', return_value='Linux'), \
                 patch('main.platform.release', return_value='5.4.0'), \
                 patch('main.platform.machine', return_value='x86_64'):

                response = client.get("/system-info/")
                assert response.status_code == 200

                data = response.json()
                assert 'cpu' in data
                assert 'memory' in data
                assert 'disk' in data
                assert 'threads' in data
                assert 'platform' in data

                # Verify data structure
                assert data['cpu']['cpu_percent'] == 25.5
                assert data['memory']['total'] == 8000000000
                assert data['memory']['percent'] == 50.0
                assert data['disk']['percent'] == 50.0
                assert data['threads']['active_threads'] == 5
                assert data['platform']['system'] == 'Linux'

    def test_system_info_psutil_error(self, client):
        """Test system info endpoint with psutil error."""
        with patch('main.psutil') as mock_psutil:
            mock_psutil.cpu_percent.side_effect = Exception("System error")

            response = client.get("/system-info/")
            assert response.status_code == 500

            data = response.json()
            assert 'detail' in data
            assert 'Error retrieving system information' in data['detail']


@pytest.mark.unit
class TestClearEndpoint:
    """Test the /clear/ endpoint."""

    def test_clear_success(self, client, session_id, mock_handler):
        """Test successful record clearing via JSON body."""
        mock_handler.clear_records.return_value = ClearResponse(
            message='Successfully cleared all records',
            records_deleted=5
        )

        response = client.post("/clear/", json={"session_id": session_id})
        assert response.status_code == 200

        data = response.json()
        assert data['message'] == 'Successfully cleared all records'
        assert data['records_deleted'] == 5

        # Verify handler was called with correct session_id
        mock_handler.clear_records.assert_called_once_with(session_id)

    def test_clear_missing_session_id(self, client):
        """Test that clear endpoint requires session_id."""
        response = client.post("/clear/", json={})
        assert response.status_code == 422


    def test_clear_database_error(self, client, session_id, mock_handler):
        """Test clear endpoint with database error."""
        mock_handler.clear_records.side_effect = Exception("Database error")

        response = client.post("/clear/", json={"session_id": session_id})
        assert response.status_code == 500

        data = response.json()
        assert 'detail' in data
        assert 'Error clearing records from database' in data['detail']


@pytest.mark.unit
class TestEditRecordEndpoint:
    """Test the /edit_record/ endpoint."""

    def test_edit_record_success(self, client, session_id, mock_handler):
        """Test successful record edit."""
        updated_record = TransactionRecord(
            id=1, bank='AMEX', date=date(2025, 1, 1),
            description='STARBUCKS COFFEE', amount=15.50, category='FOOD'
        )
        mock_handler.update_record.return_value = updated_record

        response = client.put("/edit_record/", json={
            "id": 1,
            "category": "FOOD",
            "session_id": session_id
        })
        assert response.status_code == 200

        data = response.json()
        assert data['success'] is True
        assert data['updated_record'] is not None

    def test_edit_record_no_fields(self, client, session_id):
        """Test edit with no update fields."""
        response = client.put("/edit_record/", json={
            "id": 1,
            "session_id": session_id
        })
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is False

    def test_edit_record_not_found(self, client, session_id, mock_handler):
        """Test edit of non-existent record."""
        mock_handler.update_record.return_value = None

        response = client.put("/edit_record/", json={
            "id": 999,
            "category": "FOOD",
            "session_id": session_id
        })
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is False


@pytest.mark.unit
class TestSessionIsolation:
    """Test session isolation across all endpoints."""

    def test_multiple_sessions_isolated(self, client, mock_handler):
        """Test that multiple sessions are properly isolated."""
        session1 = str(uuid.uuid4())
        session2 = str(uuid.uuid4())

        # Mock different data for each session
        def mock_get_records(bank, session_id):
            if session_id == session1:
                return [TransactionRecord(id=1, bank='AMEX', date=date(2025, 1, 1), description='STARBUCKS', amount=15.50, category='FOOD')]
            else:
                return [TransactionRecord(id=2, bank='CITI', date=date(2025, 1, 2), description='SHELL', amount=45.00, category='GAS')]

        mock_handler.get_records.side_effect = mock_get_records
        mock_handler.get_income.return_value = None

        # Test session 1
        response1 = client.post("/records/", json={"session_id": session1})
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1['records'][0]['bank'] == 'AMEX'

        # Test session 2
        response2 = client.post("/records/", json={"session_id": session2})
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2['records'][0]['bank'] == 'CITI'

        # Verify handler was called with correct session IDs
        assert mock_handler.get_records.call_count == 2
        mock_handler.get_records.assert_any_call("", session1)
        mock_handler.get_records.assert_any_call("", session2)


@pytest.mark.unit
class TestErrorHandling:
    """Test error handling across all endpoints."""

    def test_404_for_unknown_endpoint(self, client):
        """Test 404 response for unknown endpoints."""
        response = client.get("/unknown-endpoint/")
        assert response.status_code == 404

    def test_method_not_allowed(self, client):
        """Test 405 response for wrong HTTP methods."""
        response = client.post("/categories/")
        assert response.status_code == 405

        response = client.get("/clear/")
        assert response.status_code == 405

        response = client.get("/records/")
        assert response.status_code == 405

    def test_validation_errors_format(self, client):
        """Test that validation errors have consistent format."""
        # Test missing required field in JSON body
        response = client.post("/records/", json={})
        assert response.status_code == 422

        data = response.json()
        assert 'detail' in data
        assert isinstance(data['detail'], list)
        assert len(data['detail']) > 0
        assert 'field' in data['detail'][0] or 'loc' in data['detail'][0]


@pytest.mark.unit
class TestHealthAndDiagnostics:
    """Test health and diagnostic endpoints."""

    def test_root_endpoint(self, client):
        """Test root endpoint returns app info."""
        response = client.get("/")
        assert response.status_code == 200

        data = response.json()
        assert 'message' in data
        assert 'version' in data or 'status' in data

    def test_docs_endpoint_available(self, client):
        """Test that API documentation is available."""
        response = client.get("/docs")
        assert response.status_code == 200

        # Test OpenAPI spec
        response = client.get("/openapi.json")
        assert response.status_code == 200

        data = response.json()
        assert 'openapi' in data
        assert 'info' in data
        assert 'paths' in data

    def test_openapi_spec_configuration(self, client):
        """Test that OpenAPI spec is properly configured with custom metadata."""
        response = client.get("/openapi.json")
        assert response.status_code == 200

        spec = response.json()

        # Test custom API metadata (this was the main fix for the YAML parser error)
        assert spec["info"]["title"] == "Financial Statement Processing API"
        assert spec["info"]["version"] == "1.0.0"
        assert "comprehensive FastAPI backend service" in spec["info"]["description"]
        assert spec["info"]["contact"]["name"] == "API Support"
        assert spec["info"]["contact"]["email"] == "support@mcontr.dev"
        assert spec["info"]["license"]["name"] == "MIT License"

        # Test servers configuration
        assert len(spec["servers"]) == 3  # includes root_path /api
        server_urls = [server["url"] for server in spec["servers"]]
        assert "https://mcontr.dev/api" in server_urls
        assert "http://localhost:8000" in server_urls

        # Test that all endpoints have proper tags
        paths = spec["paths"]
        assert len(paths) == 9  # root, categories, categories/{name}, records, parse, system-info, clear, edit_record, session/income

        # Test specific endpoint tags - this ensures proper organization in Swagger UI
        assert "Categories" in paths["/categories/"]["get"]["tags"]
        assert "Categories" in paths["/categories/{category_name}"]["patch"]["tags"]
        assert "Categories" in paths["/categories/{category_name}"]["delete"]["tags"]
        assert "Records" in paths["/records/"]["post"]["tags"]
        assert "Processing" in paths["/parse/"]["post"]["tags"]
        assert "System" in paths["/system-info/"]["get"]["tags"]
        assert "Records" in paths["/clear/"]["post"]["tags"]

        # Test that we have proper response models - ensures type safety
        assert "components" in spec
        assert "schemas" in spec["components"]

        # Test that key response models exist (validates Pydantic integration)
        schemas = spec["components"]["schemas"]
        expected_schemas = [
            "APIInfoResponse", "SessionCategoriesResponse", "CategoryActionResponse",
            "EnrichedRecordsResponse", "ParseResponse", "SystemInfoResponse", "ClearResponse",
            "BankType", "TransactionCategory", "TransactionRecord"
        ]
        for schema_name in expected_schemas:
            assert schema_name in schemas, f"Missing schema: {schema_name}"


@pytest.mark.unit
class TestSessionIncomeEndpoint:
    """Test the /session/income/ endpoint."""

    def test_set_income_success(self, client, session_id, mock_handler):
        """Test successful income save."""
        response = client.post("/session/income/", json={
            "session_id": session_id,
            "monthly_income": 5000.0
        })
        assert response.status_code == 200

        data = response.json()
        assert data['session_id'] == session_id
        assert data['monthly_income'] == 5000.0
        mock_handler.set_income.assert_called_once_with(session_id, 5000.0)

    def test_set_income_missing_session_id(self, client):
        """Test that income endpoint requires session_id."""
        response = client.post("/session/income/", json={"monthly_income": 5000.0})
        assert response.status_code == 422

    def test_set_income_missing_amount(self, client, session_id):
        """Test that income endpoint requires monthly_income."""
        response = client.post("/session/income/", json={"session_id": session_id})
        assert response.status_code == 422

    def test_set_income_non_uuid_session_id(self, client, mock_handler):
        """Test income endpoint accepts non-UUID session_id (session_id is plain string)."""
        response = client.post("/session/income/", json={
            "session_id": "not-a-uuid",
            "monthly_income": 5000.0
        })
        assert response.status_code == 200


@pytest.mark.unit
class TestCategoryManagementEndpoints:
    """Test PATCH and DELETE /categories/{category_name} endpoints."""

    def test_upsert_category_success(self, client, session_id, mock_handler):
        """Test successful category upsert triggers re-categorization."""
        mock_handler.upsert_session_category.return_value = None
        mock_handler.recategorize_records.return_value = 10

        response = client.patch(f"/categories/GAS", json={
            "session_id": session_id,
            "keywords": ["CHEVRON", "SHELL", "76"]
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["category"] == "GAS"
        assert data["records_updated"] == 10
        mock_handler.upsert_session_category.assert_called_once_with(
            session_id, "GAS", ["CHEVRON", "SHELL", "76"]
        )
        mock_handler.recategorize_records.assert_called_once_with(session_id)

    def test_upsert_category_missing_session_id(self, client):
        """Test that upsert requires session_id."""
        response = client.patch("/categories/GAS", json={"keywords": ["CHEVRON"]})
        assert response.status_code == 422

    def test_upsert_category_missing_keywords(self, client, session_id):
        """Test that upsert requires keywords."""
        response = client.patch("/categories/GAS", json={"session_id": session_id})
        assert response.status_code == 422

    def test_upsert_category_keywords_uppercased(self, client, session_id, mock_handler):
        """Test that keywords are normalized to uppercase."""
        mock_handler.upsert_session_category.return_value = None
        mock_handler.recategorize_records.return_value = 0

        response = client.patch("/categories/food", json={
            "session_id": session_id,
            "keywords": ["starbucks", "coffee"]
        })
        assert response.status_code == 200
        data = response.json()
        # Keywords cleaned to uppercase by validator
        assert all(kw == kw.upper() for kw in data["keywords"])

    def test_delete_category_success(self, client, session_id, mock_handler):
        """Test successful category override deletion."""
        mock_handler.delete_session_category.return_value = True
        mock_handler.recategorize_records.return_value = 5

        response = client.request("DELETE", "/categories/GAS", json={"session_id": session_id})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["records_updated"] == 5
        mock_handler.delete_session_category.assert_called_once_with(session_id, "GAS")
        mock_handler.recategorize_records.assert_called_once_with(session_id)

    def test_delete_category_not_found(self, client, session_id, mock_handler):
        """Test delete returns success=False when no override exists."""
        mock_handler.delete_session_category.return_value = False
        mock_handler.recategorize_records.return_value = 0

        response = client.request("DELETE", "/categories/GAS", json={"session_id": session_id})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert data["records_updated"] == 0
        # recategorize should NOT be called when nothing was deleted
        mock_handler.recategorize_records.assert_not_called()

    def test_delete_category_missing_session_id(self, client):
        """Test that delete requires session_id."""
        response = client.request("DELETE", "/categories/GAS", json={})
        assert response.status_code == 422

    def test_get_categories_with_session_id(self, client, session_id, mock_handler):
        """Test GET /categories/ returns merged categories when session_id provided."""
        mock_handler.get_session_categories.return_value = {"CUSTOM": ["MY_STORE"]}

        response = client.get(f"/categories/?session_id={session_id}")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert "session_overrides" in data
        assert "CUSTOM" in data["session_overrides"]

    def test_get_categories_without_session_id(self, client):
        """Test GET /categories/ returns global defaults when no session_id."""
        response = client.get("/categories/")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert "session_overrides" in data
        assert data["session_overrides"] == {}


if __name__ == "__main__":
    # Run all tests
    pytest.main([__file__, "-v", "--tb=short"])
