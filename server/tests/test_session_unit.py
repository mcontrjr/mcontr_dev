import pytest
import uuid
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from src.handler import PostgresHandler
from main import app


@pytest.mark.unit
class TestSessionIsolation:
    """Test session isolation functionality to ensure different sessions don't interfere with each other."""
    
    @pytest.fixture
    def client(self):
        """Create a test client for the FastAPI app."""
        return TestClient(app)
    
    @pytest.fixture
    def session_ids(self):
        """Generate two unique session IDs for testing."""
        return {
            'session_1': str(uuid.uuid4()),
            'session_2': str(uuid.uuid4())
        }
    
    @pytest.fixture
    def mock_handler(self):
        """Mock the PostgresHandler to avoid actual database operations."""
        with patch('main.handler') as mock:
            yield mock
    
    def test_records_endpoint_isolation(self, client, session_ids, mock_handler):
        """Test that /records/ endpoint returns isolated data per session."""
        # Mock empty records for both sessions
        mock_handler.get_records.return_value = {'records': [], 'count': 0}
        
        # Test session 1
        response_1 = client.get(f"/records/?session_id={session_ids['session_1']}")
        assert response_1.status_code == 200
        data_1 = response_1.json()
        assert data_1['count'] == 0
        assert data_1['records'] == []
        
        # Test session 2
        response_2 = client.get(f"/records/?session_id={session_ids['session_2']}")
        assert response_2.status_code == 200
        data_2 = response_2.json()
        assert data_2['count'] == 0
        assert data_2['records'] == []
        
        # Verify handler was called with correct session IDs
        assert mock_handler.get_records.call_count == 2
        mock_handler.get_records.assert_any_call("", session_ids['session_1'])
        mock_handler.get_records.assert_any_call("", session_ids['session_2'])
    
    def test_clear_endpoint_isolation(self, client, session_ids, mock_handler):
        """Test that /clear/ endpoint only clears data for the specified session."""
        # Mock successful clear response
        mock_handler.clear_records.return_value = {
            'message': 'Successfully cleared all records',
            'records_deleted': 0
        }
        
        # Clear session 1
        response_1 = client.post(f"/clear/", data={'session_id': session_ids['session_1']})
        assert response_1.status_code == 200
        data_1 = response_1.json()
        assert data_1['message'] == 'Successfully cleared all records'
        assert data_1['records_deleted'] == 0
        
        # Clear session 2
        response_2 = client.post(f"/clear/", data={'session_id': session_ids['session_2']})
        assert response_2.status_code == 200
        data_2 = response_2.json()
        assert data_2['message'] == 'Successfully cleared all records'
        assert data_2['records_deleted'] == 0
        
        # Verify handler was called with correct session IDs
        assert mock_handler.clear_records.call_count == 2
        mock_handler.clear_records.assert_any_call(session_ids['session_1'])
        mock_handler.clear_records.assert_any_call(session_ids['session_2'])
    
    def test_parse_endpoint_session_isolation(self, client, session_ids, mock_handler):
        """Test that /parse/ endpoint saves data to the correct session."""
        # Mock successful parsing
        mock_handler.save_to_database.return_value = None
        
        # Mock file upload
        test_file_content = b"fake pdf content"
        
        with patch('main.Parser') as mock_parser, \
             patch('main.os.makedirs') as mock_makedirs, \
             patch('main.open', create=True) as mock_open, \
             patch('main.shutil.copyfileobj') as mock_copyfileobj:
            
            mock_parser.return_value.purchases = [
                {
                    'Bank': 'TEST',
                    'Date': '2025-01-01',
                    'Description': 'Test Transaction',
                    'Amount': 100.00,
                    'Category': 'TEST'
                }
            ]
            
            # Upload file for session 1
            response_1 = client.post(
                "/parse/",
                files={"pdf_files": ("test1.pdf", test_file_content, "application/pdf")},
                data={"session_id": session_ids['session_1']}
            )
            assert response_1.status_code == 200
            assert response_1.json()['status'] == 'success'
            
            # Upload file for session 2
            response_2 = client.post(
                "/parse/",
                files={"pdf_files": ("test2.pdf", test_file_content, "application/pdf")},
                data={"session_id": session_ids['session_2']}
            )
            assert response_2.status_code == 200
            assert response_2.json()['status'] == 'success'
            
            # Verify handler was called with correct session IDs
            assert mock_handler.save_to_database.call_count == 2
            mock_handler.save_to_database.assert_any_call(
                mock_parser.return_value.purchases,
                session_ids['session_1']
            )
            mock_handler.save_to_database.assert_any_call(
                mock_parser.return_value.purchases,
                session_ids['session_2']
            )
    
    def test_session_id_required_for_records(self, client):
        """Test that session_id is required for /records/ endpoint."""
        response = client.get("/records/")
        assert response.status_code == 422  # Validation error
    
    def test_session_id_required_for_clear(self, client):
        """Test that session_id is required for /clear/ endpoint."""
        response = client.post("/clear/")
        assert response.status_code == 422  # Validation error
    
    def test_session_id_required_for_parse(self, client):
        """Test that session_id is required for /parse/ endpoint."""
        test_file_content = b"fake pdf content"
        response = client.post(
            "/parse/",
            files={"pdf_files": ("test.pdf", test_file_content, "application/pdf")}
        )
        assert response.status_code == 422  # Validation error


@pytest.mark.unit
class TestPostgresHandlerSessionIsolation:
    """Test PostgresHandler methods for session isolation."""
    
    @pytest.fixture
    def handler(self):
        """Create a PostgresHandler instance."""
        return PostgresHandler()
    
    @pytest.fixture
    def mock_connection(self):
        """Mock psycopg2 connection."""
        with patch('psycopg2.connect') as mock_connect:
            mock_conn = MagicMock()
            mock_cursor = MagicMock()
            mock_conn.cursor.return_value = mock_cursor
            mock_connect.return_value = mock_conn
            yield mock_conn, mock_cursor
    
    def test_get_records_session_isolation(self, handler, mock_connection):
        """Test that get_records filters by session_id."""
        mock_conn, mock_cursor = mock_connection
        session_id = str(uuid.uuid4())
        
        # Mock database response
        mock_cursor.fetchall.return_value = [
            (1, 'TEST', '2025-01-01', 'Test Transaction', 100.00, 'TEST')
        ]
        
        result = handler.get_records("", session_id)
        
        # Verify SQL query includes session_id filter
        mock_cursor.execute.assert_called_once()
        query = mock_cursor.execute.call_args[0][0]
        params = mock_cursor.execute.call_args[0][1]
        assert "session_id = %s" in query
        assert params == [session_id]
    
    def test_clear_records_session_isolation(self, handler, mock_connection):
        """Test that clear_records only deletes records for the specified session."""
        mock_conn, mock_cursor = mock_connection
        session_id = str(uuid.uuid4())
        
        # Mock database responses
        mock_cursor.fetchone.return_value = (5,)  # 5 records to delete
        
        result = handler.clear_records(session_id)
        
        # Verify both SELECT and DELETE queries filter by session_id
        assert mock_cursor.execute.call_count == 2
        
        # Check SELECT query
        select_query = mock_cursor.execute.call_args_list[0][0][0]
        assert "WHERE session_id = %s" in select_query
        assert mock_cursor.execute.call_args_list[0][0][1] == (session_id,)
        
        # Check DELETE query
        delete_query = mock_cursor.execute.call_args_list[1][0][0]
        assert "WHERE session_id = %s" in delete_query
        assert mock_cursor.execute.call_args_list[1][0][1] == (session_id,)
        
        # Verify result
        assert result['message'] == 'Successfully cleared all records'
        assert result['records_deleted'] == 5
    
    def test_save_to_database_session_isolation(self, handler, mock_connection):
        """Test that save_to_database includes session_id in INSERT statement."""
        mock_conn, mock_cursor = mock_connection
        session_id = str(uuid.uuid4())
        
        # Mock get_records to return empty results
        with patch.object(handler, 'get_records', return_value={'records': []}):
            from src.models import ParsedTransaction, BankType, TransactionCategory
            from datetime import date
            
            purchases = [
                ParsedTransaction(
                    bank=BankType.AMEX,  # Using valid enum value
                    date=date(2025, 1, 1),
                    description='Test Transaction',
                    amount=100.00,
                    category=TransactionCategory.OTHER  # Using valid enum value
                )
            ]
            
            handler.save_to_database(purchases, session_id)
            
            # Verify INSERT query includes session_id
            mock_cursor.execute.assert_called()
            query = mock_cursor.execute.call_args[0][0]
            params = mock_cursor.execute.call_args[0][1]
            
            assert "session_id" in query
            assert params[-1] == session_id  # session_id should be last parameter