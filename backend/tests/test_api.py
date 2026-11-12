import io
import pytest
from app.core.config import settings

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True
    assert "1.0.0" in data["model_version"]

    # Also test /api/health for frontend client compatibility
    api_response = client.get("/api/health")
    assert api_response.status_code == 200
    assert api_response.json()["status"] == "ok"

def test_get_metrics(client):
    response = client.get("/api/analytics/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "accuracy" in data
    assert "precision_macro" in data
    assert "confusion_matrix" in data
    assert data["is_synthetic"] is True

def test_auth_workflow(client):
    import uuid
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    password = "SecretPassword123!"

    # 1. Register
    reg_res = client.post("/api/auth/register", json={
        "name": "Integration Tester",
        "email": unique_email,
        "password": password
    })
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == unique_email
    token = reg_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Duplicate email rejected
    dup_res = client.post("/api/auth/register", json={
        "name": "Another Name",
        "email": unique_email,
        "password": password
    })
    assert dup_res.status_code == 400

    # 3. Login
    login_res = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": password
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Login wrong password
    bad_login = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "wrongpassword"
    })
    assert bad_login.status_code == 401

    # 5. Get Profile
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Integration Tester"

def test_document_lifecycle(client):
    import uuid
    user_email = f"doc_tester_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = client.post("/api/auth/register", json={
        "name": "Doc Tester",
        "email": user_email,
        "password": "SecurePassword123!"
    })
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    # 1. Upload TXT resume document
    file_content = b"John Doe Senior Software Engineer Skills Python React Docker Kubernetes AWS PostgreSQL B.Tech in CS."
    files = {"file": ("john_doe_resume.txt", io.BytesIO(file_content), "text/plain")}
    upload_res = client.post("/api/documents/upload", headers=headers, files=files)
    assert upload_res.status_code == 201
    doc = upload_res.json()
    doc_id = doc["id"]
    assert doc["original_filename"] == "john_doe_resume.txt"
    assert doc["predicted_category"] == "resume"
    assert doc["classification_score"] is not None
    assert doc["effective_category"] == "resume"

    # 2. List documents
    list_res = client.get("/api/documents", headers=headers)
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    assert any(d["id"] == doc_id for d in list_data["items"])

    # 3. Search document
    search_res = client.get("/api/documents/search?q=Python", headers=headers)
    assert search_res.status_code == 200
    assert len(search_res.json()) >= 1

    # 4. Get single document details
    get_res = client.get(f"/api/documents/{doc_id}", headers=headers)
    assert get_res.status_code == 200
    assert "John Doe" in get_res.json()["extracted_text"]

    # 5. Manual category correction
    patch_res = client.patch(f"/api/documents/{doc_id}/category", headers=headers, json={
        "category": "academic_document",
        "notes": "Testing manual category adjustment"
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["new_category"] == "academic_document"

    # Verify effective category is updated
    updated_get = client.get(f"/api/documents/{doc_id}", headers=headers)
    assert updated_get.json()["effective_category"] == "academic_document"
    assert updated_get.json()["manually_corrected_category"] == "academic_document"

    # 6. Reclassify
    reclass_res = client.post(f"/api/documents/{doc_id}/reclassify", headers=headers)
    assert reclass_res.status_code == 200
    assert reclass_res.json()["new_category"] == "resume"

    # 7. Download
    down_res = client.get(f"/api/documents/{doc_id}/download", headers=headers)
    assert down_res.status_code == 200
    assert len(down_res.content) == len(file_content)

    # 8. Delete
    del_res = client.delete(f"/api/documents/{doc_id}", headers=headers)
    assert del_res.status_code == 204

    # Verify deleted
    not_found_res = client.get(f"/api/documents/{doc_id}", headers=headers)
    assert not_found_res.status_code == 404

def test_analytics_endpoints(client):
    import uuid
    user_email = f"analytics_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/api/auth/register", json={
        "name": "Analytics Tester",
        "email": user_email,
        "password": "Password123!"
    })
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    ov = client.get("/api/analytics/overview", headers=headers)
    assert ov.status_code == 200
    assert "total_documents" in ov.json()

    cats = client.get("/api/analytics/categories", headers=headers)
    assert cats.status_code == 200
    assert isinstance(cats.json(), list)

    act = client.get("/api/analytics/activity", headers=headers)
    assert act.status_code == 200
    assert isinstance(act.json(), list)

