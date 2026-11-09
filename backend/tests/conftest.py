import sys
import os
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.main import app
from app.core.security import create_access_token

@pytest.fixture(scope="session")
def client():
    """Synchronous FastAPI TestClient."""
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def auth_headers():
    """Generates an authorization header with a valid test JWT."""
    from bson import ObjectId
    test_user_id = str(ObjectId())
    token = create_access_token({"sub": test_user_id})
    return {"Authorization": f"Bearer {token}"}

