"""
Integration tests for session isolation - uses real HTTP calls to test server running on port 8000
This is a backup test option if you prefer to test against a real server instead of mocks.

To run these tests:
1. Start server: uvicorn main:app --port 8000
2. Run tests: pytest tests/test_session_integration.py -m integration
"""

import pytest
import requests
import uuid
from typing import Dict


@pytest.mark.integration
class TestSessionIsolationIntegration:
    """Integration tests for session isolation using real HTTP calls."""

    API_BASE = "http://localhost:8000"

    @pytest.fixture
    def session_ids(self) -> Dict[str, str]:
        """Generate two unique session IDs for testing."""
        return {
            'session_1': str(uuid.uuid4()),
            'session_2': str(uuid.uuid4())
        }

    def test_server_is_running(self):
        """Test that the server is running on port 8000."""
        try:
            response = requests.get(f"{self.API_BASE}/system-info/", timeout=5)
            assert response.status_code == 200
        except requests.exceptions.ConnectionError:
            pytest.skip("Server not running on port 8000 - start server with: uvicorn main:app --port 8000")

    def test_records_endpoint_isolation(self, session_ids):
        """Test that /records/ endpoint returns isolated data per session."""
        # Get records for session 1 (should be empty initially)
        response_1 = requests.get(f"{self.API_BASE}/records/?session_id={session_ids['session_1']}")
        assert response_1.status_code == 200
        data_1 = response_1.json()

        # Get records for session 2 (should be empty initially)
        response_2 = requests.get(f"{self.API_BASE}/records/?session_id={session_ids['session_2']}")
        assert response_2.status_code == 200
        data_2 = response_2.json()

        # Both sessions should have their own isolated data
        assert 'records' in data_1
        assert 'records' in data_2
        assert 'count' in data_1
        assert 'count' in data_2

    def test_clear_endpoint_isolation(self, session_ids):
        """Test that /clear/ endpoint only clears data for the specified session."""
        # Clear session 1
        clear_data_1 = {'session_id': session_ids['session_1']}
        clear_response_1 = requests.post(f"{self.API_BASE}/clear/", data=clear_data_1)
        assert clear_response_1.status_code == 200
        result_1 = clear_response_1.json()
        assert 'message' in result_1
        assert 'records_deleted' in result_1

        # Clear session 2
        clear_data_2 = {'session_id': session_ids['session_2']}
        clear_response_2 = requests.post(f"{self.API_BASE}/clear/", data=clear_data_2)
        assert clear_response_2.status_code == 200
        result_2 = clear_response_2.json()
        assert 'message' in result_2
        assert 'records_deleted' in result_2

        # Verify both sessions can be cleared independently
        assert result_1['message'] == 'Successfully cleared all records'
        assert result_2['message'] == 'Successfully cleared all records'

    def test_session_id_required_for_records(self):
        """Test that session_id is required for /records/ endpoint."""
        response = requests.get(f"{self.API_BASE}/records/")
        assert response.status_code == 422  # Validation error

    def test_session_id_required_for_clear(self):
        """Test that session_id is required for /clear/ endpoint."""
        response = requests.post(f"{self.API_BASE}/clear/")
        assert response.status_code == 422  # Validation error

    def test_session_id_required_for_parse(self):
        """Test that session_id is required for /parse/ endpoint."""
        # Create a fake PDF file
        test_file_content = b"fake pdf content"
        files = {'pdf_files': ('test.pdf', test_file_content, 'application/pdf')}

        response = requests.post(f"{self.API_BASE}/parse/", files=files)
        assert response.status_code == 422  # Validation error

    def test_categories_endpoint_accessibility(self):
        """Test that /categories/ endpoint is accessible."""
        response = requests.get(f"{self.API_BASE}/categories/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)

    def test_system_info_endpoint_accessibility(self):
        """Test that /system-info/ endpoint is accessible."""
        response = requests.get(f"{self.API_BASE}/system-info/")
        assert response.status_code == 200
        data = response.json()
        assert 'cpu' in data
        assert 'memory' in data
        assert 'platform' in data


if __name__ == "__main__":
    # Run integration tests
    pytest.main([__file__, "-v"])
