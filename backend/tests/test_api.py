# pyrefly: ignore [missing-import]
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import os
import tempfile

from app.main import app

client = TestClient(app)

@patch('app.api.routes.crawl_directory', new_callable=AsyncMock)
def test_scan_repository(mock_crawl):
    with tempfile.TemporaryDirectory() as temp_dir:
        test_file = os.path.join(temp_dir, "test.py")
        with open(test_file, "w", encoding='utf-8') as f:
            f.write("import os")
            
        mock_crawl.return_value = [test_file]
        
        response = client.post("/api/scan", json={"target_path": temp_dir})
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["nodes"]) == 1
        assert data["nodes"][0]["id"] == test_file
        assert data["nodes"][0]["label"] == "test.py"
        
        assert len(data["edges"]) == 1
        assert data["edges"][0]["source"] == test_file
        assert data["edges"][0]["target"] == "os"
        assert data["edges"][0]["id"] == f"{test_file}-os"

def test_scan_repository_invalid_path():
    response = client.post("/api/scan", json={"target_path": "/invalid/nonexistent/path/123"})
    assert response.status_code == 400

@patch('app.api.routes.get_file_summary', new_callable=AsyncMock)
def test_get_summary(mock_get_file_summary):
    mock_get_file_summary.return_value = {"summary": "Test summary", "loc": 5}
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".py") as tmp_file:
        tmp_file.write(b"line1\nline2\n")
        tmp_file_path = tmp_file.name
        
    try:
        response = client.post("/api/summary", json={"file_path": tmp_file_path})
        assert response.status_code == 200
        data = response.json()
        assert data["summary"] == "Test summary"
        assert data["loc"] == 5
    finally:
        os.remove(tmp_file_path)

def test_get_summary_not_found():
    response = client.post("/api/summary", json={"file_path": "/invalid/nonexistent/path/123.py"})
    assert response.status_code == 404
