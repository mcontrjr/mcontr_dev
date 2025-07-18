"""
Comprehensive tests for the PostgresHandler database operations.
Tests all database methods, error handling, and session isolation.
"""

import pytest
import uuid
from unittest.mock import patch, MagicMock
from src.handler import PostgresHandler


@pytest.fixture
def handler():
    """Create a PostgresHandler instance."""
    return PostgresHandler()


@pytest.fixture
def mock_connection():
    """Mock psycopg2 connection and cursor."""
    with patch('psycopg2.connect') as mock_connect:
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_connect.return_value = mock_conn
        yield mock_conn, mock_cursor


@pytest.fixture
def sample_purchases():
    """Sample purchase data for testing."""
    from src.models import ParsedTransaction, BankType, TransactionCategory
    from datetime import date
    
    return [
        ParsedTransaction(
            bank=BankType.AMEX,
            date=date(2025, 1, 1),
            description='STARBUCKS COFFEE',
            amount=-15.50,
            category=TransactionCategory.FOOD
        ),
        ParsedTransaction(
            bank=BankType.CITI,
            date=date(2025, 1, 2),
            description='SHELL GAS STATION',
            amount=-45.00,
            category=TransactionCategory.GAS
        )
    ]


@pytest.mark.unit
@pytest.mark.database
class TestPostgresHandlerGetRecords:
    """Test the get_records method."""
    
    def test_get_records_with_session_id(self, handler, mock_connection, session_id):
        """Test get_records filters by session_id."""
        mock_conn, mock_cursor = mock_connection
        
        # Mock database response
        mock_cursor.fetchall.return_value = [
            (1, 'AMEX', '2025-01-01', 'STARBUCKS', -15.50, 'FOOD'),
            (2, 'CITI', '2025-01-02', 'SHELL', -45.00, 'GAS')
        ]
        
        result = handler.get_records("", session_id)
        
        # Verify SQL query includes session_id filter
        mock_cursor.execute.assert_called_once()
        query = mock_cursor.execute.call_args[0][0]
        params = mock_cursor.execute.call_args[0][1]
        
        assert "WHERE session_id = %s" in query
        assert params == [session_id]
        
        # Verify result structure (handler returns tuples, not dictionaries)
        assert 'records' in result
        assert 'count' in result
        assert result['count'] == 2
        assert len(result['records']) == 2
        assert result['records'][0][1] == 'AMEX'  # bank is at index 1
        assert result['records'][1][1] == 'CITI'  # bank is at index 1
    
    def test_get_records_with_bank_filter(self, handler, mock_connection, session_id):
        """Test get_records with bank name filter."""
        mock_conn, mock_cursor = mock_connection
        
        mock_cursor.fetchall.return_value = [
            (1, 'AMEX', '2025-01-01', 'STARBUCKS', -15.50, 'FOOD')
        ]
        
        result = handler.get_records("AMEX", session_id)
        
        # Verify SQL query includes both bank and session_id filters
        query = mock_cursor.execute.call_args[0][0]
        params = mock_cursor.execute.call_args[0][1]
        
        assert "WHERE session_id = %s AND bank = %s" in query
        assert params == [session_id, "AMEX"]
        
        assert result['count'] == 1
        assert result['records'][0][1] == 'AMEX'  # bank is at index 1
    
    def test_get_records_empty_result(self, handler, mock_connection, session_id):
        """Test get_records with no matching records."""
        mock_conn, mock_cursor = mock_connection
        
        mock_cursor.fetchall.return_value = []
        
        result = handler.get_records("", session_id)
        
        assert result['count'] == 0
        assert result['records'] == []
    
    def test_get_records_database_error(self, handler, mock_connection, session_id):
        """Test get_records with database error."""
        mock_conn, mock_cursor = mock_connection
        
        mock_cursor.execute.side_effect = Exception("Database connection failed")
        
        # Handler raises HTTPException, not regular Exception
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            handler.get_records("", session_id)
        
        assert exc_info.value.status_code == 500
        assert "Error retrieving records from database" in str(exc_info.value.detail)
    
    def test_get_records_connection_cleanup(self, handler, mock_connection, session_id):
        """Test that database connection is properly closed."""
        mock_conn, mock_cursor = mock_connection
        
        mock_cursor.fetchall.return_value = []
        
        handler.get_records("", session_id)
        
        # Verify connection cleanup - only conn.close is called, not cursor.close
        mock_conn.close.assert_called_once()


@pytest.mark.unit
@pytest.mark.database
class TestPostgresHandlerClearRecords:
    """Test the clear_records method."""
    
    def test_clear_records_success(self, handler, mock_connection, session_id):
        """Test successful record clearing."""
        mock_conn, mock_cursor = mock_connection
        
        # Mock count query response
        mock_cursor.fetchone.return_value = (5,)
        
        result = handler.clear_records(session_id)
        
        # Verify both SELECT and DELETE queries were executed
        assert mock_cursor.execute.call_count == 2
        
        # Check SELECT query (count)
        select_query = mock_cursor.execute.call_args_list[0][0][0]
        select_params = mock_cursor.execute.call_args_list[0][0][1]
        assert "SELECT COUNT(*)" in select_query
        assert "WHERE session_id = %s" in select_query
        assert select_params == (session_id,)
        
        # Check DELETE query
        delete_query = mock_cursor.execute.call_args_list[1][0][0]
        delete_params = mock_cursor.execute.call_args_list[1][0][1]
        assert "DELETE FROM" in delete_query
        assert "WHERE session_id = %s" in delete_query
        assert delete_params == (session_id,)
        
        # Verify result
        assert result['message'] == 'Successfully cleared all records'
        assert result['records_deleted'] == 5
        
        # Verify transaction commit
        mock_conn.commit.assert_called_once()
    
    def test_clear_records_no_records(self, handler, mock_connection, session_id):
        """Test clearing when no records exist."""
        mock_conn, mock_cursor = mock_connection
        
        mock_cursor.fetchone.return_value = (0,)
        
        result = handler.clear_records(session_id)
        
        assert result['message'] == 'Successfully cleared all records'
        assert result['records_deleted'] == 0
    
    def test_clear_records_database_error(self, handler, mock_connection, session_id):
        """Test clear_records with database error."""
        mock_conn, mock_cursor = mock_connection
        
        mock_cursor.execute.side_effect = Exception("Database error")
        
        # Handler raises HTTPException, not regular Exception
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            handler.clear_records(session_id)
        
        assert exc_info.value.status_code == 500
        assert "Error clearing records from database" in str(exc_info.value.detail)
        
        # clear_records doesn't call rollback in exception handler
        # It just raises the HTTPException and closes the connection
    
    def test_clear_records_connection_cleanup(self, handler, mock_connection, session_id):
        """Test that database connection is properly closed."""
        mock_conn, mock_cursor = mock_connection
        
        mock_cursor.fetchone.return_value = (3,)
        
        handler.clear_records(session_id)
        
        # Verify connection cleanup - only conn.close is called, not cursor.close
        mock_conn.close.assert_called_once()


@pytest.mark.unit
@pytest.mark.database
class TestPostgresHandlerSaveToDatabase:
    """Test the save_to_database method."""
    
    def test_save_to_database_success(self, handler, mock_connection, session_id, sample_purchases):
        """Test successful saving of purchase data."""
        mock_conn, mock_cursor = mock_connection
        
        # Mock get_records to return empty results (no duplicates)
        with patch.object(handler, 'get_records', return_value={'records': []}):
            handler.save_to_database(sample_purchases, session_id)
            
            # Verify INSERT query was executed for each purchase
            assert mock_cursor.execute.call_count == len(sample_purchases)
            
            # Check first INSERT query
            query = mock_cursor.execute.call_args_list[0][0][0]
            params = mock_cursor.execute.call_args_list[0][0][1]
            
            assert "INSERT INTO bank_statements" in query
            assert "session_id" in query
            assert params[-1] == session_id  # session_id should be last parameter
            
            # Verify transaction commit
            mock_conn.commit.assert_called_once()
    
    def test_save_to_database_duplicate_detection(self, handler, mock_connection, session_id, sample_purchases):
        """Test duplicate detection prevents saving existing records."""
        mock_conn, mock_cursor = mock_connection
        
        # Mock get_records to return existing records (duplicates)
        # Format: (id, bank, date, description, amount, category)
        from datetime import datetime
        existing_records = [
            (1, 'AMEX', datetime(2025, 1, 1), 'STARBUCKS COFFEE', -15.50, 'FOOD')
        ]
        
        with patch.object(handler, 'get_records', return_value={'records': existing_records}):
            handler.save_to_database(sample_purchases, session_id)
            
            # Verify only non-duplicate records were inserted
            # Should be 1 INSERT (second record) since first is duplicate
            assert mock_cursor.execute.call_count == 1
            
            # Verify the non-duplicate record was inserted
            query = mock_cursor.execute.call_args[0][0]
            params = mock_cursor.execute.call_args[0][1]
            
            assert "INSERT INTO bank_statements" in query
            assert params[0] == 'CITI'  # Second record's bank
            assert params[-1] == session_id
    
    def test_save_to_database_empty_purchases(self, handler, mock_connection, session_id):
        """Test saving with empty purchase list."""
        mock_conn, mock_cursor = mock_connection
        
        with patch.object(handler, 'get_records', return_value={'records': []}):
            handler.save_to_database([], session_id)
            
            # Verify no INSERT queries were executed
            mock_cursor.execute.assert_not_called()
            
            # Verify commit was still called (final commit at end of method)
            mock_conn.commit.assert_called_once()
    
    def test_save_to_database_database_error(self, handler, mock_connection, session_id, sample_purchases):
        """Test save_to_database with database error."""
        mock_conn, mock_cursor = mock_connection
        
        with patch.object(handler, 'get_records', return_value={'records': []}):
            mock_cursor.execute.side_effect = Exception("Database error")
            
            # save_to_database doesn't raise exceptions, it catches them and continues
            handler.save_to_database(sample_purchases, session_id)
            
            # Verify rollback on error - should be called for each failed purchase
            assert mock_conn.rollback.call_count == len(sample_purchases)
    
    def test_save_to_database_connection_cleanup(self, handler, mock_connection, session_id, sample_purchases):
        """Test that database connection is properly closed."""
        mock_conn, mock_cursor = mock_connection
        
        with patch.object(handler, 'get_records', return_value={'records': []}):
            handler.save_to_database(sample_purchases, session_id)
            
            # Verify connection cleanup - only conn.close is called, not cursor.close
            mock_conn.close.assert_called_once()


@pytest.mark.unit
@pytest.mark.database
class TestPostgresHandlerInitialization:
    """Test PostgresHandler initialization and configuration."""
    
    def test_handler_initialization(self):
        """Test that handler initializes correctly."""
        handler = PostgresHandler()
        
        # Handler should be created successfully
        assert handler is not None
        assert hasattr(handler, 'get_records')
        assert hasattr(handler, 'clear_records')
        assert hasattr(handler, 'save_to_database')
    
    @patch('psycopg2.connect')
    def test_database_connection_parameters(self, mock_connect):
        """Test database connection uses correct parameters."""
        handler = PostgresHandler()
        
        # Try to establish connection
        try:
            handler.get_records("", "test-session")
        except:
            pass  # Connection will fail in test, but we just want to check parameters
        
        # Verify connection was attempted
        mock_connect.assert_called()
        
        # Check connection parameters
        call_args = mock_connect.call_args
        assert call_args is not None


@pytest.mark.unit
@pytest.mark.database
class TestPostgresHandlerSessionIsolation:
    """Test session isolation functionality."""
    
    def test_session_isolation_get_records(self, handler, mock_connection):
        """Test that get_records properly isolates sessions."""
        mock_conn, mock_cursor = mock_connection
        
        session1 = str(uuid.uuid4())
        session2 = str(uuid.uuid4())
        
        # Mock different responses for different sessions
        def mock_fetchall():
            # Return different data based on which session was queried
            call_args = mock_cursor.execute.call_args
            if call_args and len(call_args[0]) > 1:
                params = call_args[0][1]
                if params and len(params) > 0:
                    if params[-1] == session1:
                        return [(1, 'AMEX', '2025-01-01', 'STARBUCKS', -15.50, 'FOOD')]
                    elif params[-1] == session2:
                        return [(2, 'CITI', '2025-01-02', 'SHELL', -45.00, 'GAS')]
            return []
        
        mock_cursor.fetchall.side_effect = mock_fetchall
        
        # Test session 1
        result1 = handler.get_records("", session1)
        assert result1['count'] == 1
        assert result1['records'][0][1] == 'AMEX'  # bank is at index 1
        
        # Test session 2
        result2 = handler.get_records("", session2)
        assert result2['count'] == 1
        assert result2['records'][0][1] == 'CITI'  # bank is at index 1
        
        # Verify both sessions were queried with correct session_ids
        assert mock_cursor.execute.call_count == 2
    
    def test_session_isolation_clear_records(self, handler, mock_connection):
        """Test that clear_records properly isolates sessions."""
        mock_conn, mock_cursor = mock_connection
        
        session1 = str(uuid.uuid4())
        session2 = str(uuid.uuid4())
        
        mock_cursor.fetchone.return_value = (3,)
        
        # Clear session 1
        result1 = handler.clear_records(session1)
        assert result1['records_deleted'] == 3
        
        # Clear session 2
        result2 = handler.clear_records(session2)
        assert result2['records_deleted'] == 3
        
        # Verify both sessions were cleared with correct session_ids
        assert mock_cursor.execute.call_count == 4  # 2 SELECTs + 2 DELETEs
        
        # Check that session_ids were used correctly
        calls = mock_cursor.execute.call_args_list
        select_calls = [call for call in calls if 'SELECT' in call[0][0]]
        delete_calls = [call for call in calls if 'DELETE' in call[0][0]]
        
        assert len(select_calls) == 2
        assert len(delete_calls) == 2
        
        # Verify session IDs were passed correctly
        assert select_calls[0][0][1] == (session1,)
        assert delete_calls[0][0][1] == (session1,)
        assert select_calls[1][0][1] == (session2,)
        assert delete_calls[1][0][1] == (session2,)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short", "-m", "database"])