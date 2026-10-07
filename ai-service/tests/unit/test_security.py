from fastapi import Depends
from fastapi.testclient import TestClient
from app.core.security import verify_internal_secret
from app.main import app

# Add a protected test route
@app.get("/test-protected", dependencies=[Depends(verify_internal_secret)])
async def protected_route():
    return {"status": "authorized"}


def test_missing_internal_secret_returns_401(client: TestClient) -> None:
    response = client.get("/test-protected")
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["errorCode"] == "INVALID_INTERNAL_SECRET"


def test_invalid_internal_secret_returns_401(client: TestClient) -> None:
    response = client.get(
        "/test-protected",
        headers={"x-internal-secret": "wrong-secret-token"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["errorCode"] == "INVALID_INTERNAL_SECRET"


def test_valid_internal_secret_returns_200(client: TestClient) -> None:
    response = client.get(
        "/test-protected",
        headers={"x-internal-secret": "interviewai-super-secret-dev-key-change-in-prod"},
    )
    assert response.status_code == 200
    assert response.json() == {"status": "authorized"}
