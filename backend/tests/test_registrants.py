"""
Tests for /api/registrants — CRUD, search, QR lookup, audit history.
"""
import pytest
from tests.conftest import create_admin, get_auth_headers


REGISTRANT_BASE = {
    "first_name": "Alice",
    "last_name": "Smith",
    "email": "alice@example.com",
    "phone": "555-1234",
    "city": "Los Angeles",
    "state": "CA",
    "country": "USA",
    "age_group": "adult",
    "convention": True,
    "boat_cruise": False,
}


@pytest.fixture
def auth(client, db_session):
    create_admin(db_session)
    return get_auth_headers(client)


@pytest.fixture
def registrant(client, auth):
    """Create a registrant and return the response body."""
    resp = client.post("/api/registrants", json=REGISTRANT_BASE, headers=auth)
    assert resp.status_code == 201
    return resp.json()


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

class TestCreateRegistrant:

    def test_create_success(self, client, auth):
        resp = client.post("/api/registrants", json=REGISTRANT_BASE, headers=auth)
        assert resp.status_code == 201
        body = resp.json()
        assert body["email"] == "alice@example.com"
        assert body["convention"] is True
        assert body["qr_code"] is not None

    def test_create_generates_qr_code(self, client, auth):
        resp = client.post("/api/registrants", json=REGISTRANT_BASE, headers=auth)
        assert resp.json()["qr_code"] is not None
        assert len(resp.json()["qr_code"]) > 100  # base64 QR is always long

    def test_create_duplicate_email_rejected(self, client, auth):
        client.post("/api/registrants", json=REGISTRANT_BASE, headers=auth)
        resp = client.post("/api/registrants", json=REGISTRANT_BASE, headers=auth)
        assert resp.status_code == 400

    def test_create_with_inline_payment(self, client, auth):
        payload = {**REGISTRANT_BASE, "payments": [{
            "product_type": "convention",
            "amount": "300.00",
            "stripe_pi_id": "pi_test_001",
        }]}
        resp = client.post("/api/registrants", json=payload, headers=auth)
        assert resp.status_code == 201
        assert len(resp.json()["payments"]) == 1
        assert resp.json()["payments"][0]["amount"] == "300.00"

    def test_create_requires_auth(self, client):
        resp = client.post("/api/registrants", json=REGISTRANT_BASE)
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# List & search
# ---------------------------------------------------------------------------

class TestListRegistrants:

    def test_list_all(self, client, auth, registrant):
        resp = client.get("/api/registrants", headers=auth)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_search_by_name(self, client, auth, registrant):
        resp = client.get("/api/registrants?search=Alice", headers=auth)
        assert any(r["email"] == "alice@example.com" for r in resp.json())

    def test_search_by_email(self, client, auth, registrant):
        resp = client.get("/api/registrants?search=alice@example", headers=auth)
        assert len(resp.json()) == 1

    def test_filter_by_convention(self, client, auth):
        # Convention registrant
        client.post("/api/registrants", json={**REGISTRANT_BASE, "convention": True}, headers=auth)
        # Boat cruise only registrant
        client.post("/api/registrants", json={
            **REGISTRANT_BASE, "email": "bob@example.com",
            "convention": False, "boat_cruise": True
        }, headers=auth)

        resp = client.get("/api/registrants?convention=true", headers=auth)
        assert all(r["convention"] for r in resp.json())

    def test_filter_by_boat_cruise(self, client, auth):
        client.post("/api/registrants", json={**REGISTRANT_BASE, "boat_cruise": True}, headers=auth)
        client.post("/api/registrants", json={
            **REGISTRANT_BASE, "email": "noboat@example.com", "boat_cruise": False
        }, headers=auth)
        resp = client.get("/api/registrants?boat_cruise=true", headers=auth)
        assert all(r["boat_cruise"] for r in resp.json())

    def test_list_requires_auth(self, client):
        assert client.get("/api/registrants").status_code == 401


# ---------------------------------------------------------------------------
# Get single
# ---------------------------------------------------------------------------

class TestGetRegistrant:

    def test_get_by_id(self, client, auth, registrant):
        rid = registrant["id"]
        resp = client.get(f"/api/registrants/{rid}", headers=auth)
        assert resp.status_code == 200
        assert resp.json()["id"] == rid

    def test_get_nonexistent(self, client, auth):
        resp = client.get("/api/registrants/99999", headers=auth)
        assert resp.status_code == 404

    def test_get_by_email(self, client, auth, registrant):
        resp = client.get(f"/api/registrants/by-email?email=alice@example.com", headers=auth)
        assert resp.status_code == 200
        assert resp.json()["email"] == "alice@example.com"

    def test_get_by_email_not_found(self, client, auth):
        resp = client.get("/api/registrants/by-email?email=nobody@example.com", headers=auth)
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

class TestUpdateRegistrant:

    def test_update_name(self, client, auth, registrant):
        rid = registrant["id"]
        resp = client.patch(f"/api/registrants/{rid}", json={"first_name": "Alicia"}, headers=auth)
        assert resp.status_code == 200
        assert resp.json()["first_name"] == "Alicia"

    def test_update_creates_audit_log(self, client, auth, registrant):
        rid = registrant["id"]
        client.patch(f"/api/registrants/{rid}", json={"first_name": "Alicia"}, headers=auth)
        resp = client.get(f"/api/registrants/{rid}/history", headers=auth)
        assert resp.status_code == 200
        logs = resp.json()
        assert any(l["field"] == "first_name" for l in logs)

    def test_update_email_conflict_rejected(self, client, auth, registrant):
        # Create second registrant
        client.post("/api/registrants", json={**REGISTRANT_BASE, "email": "bob@example.com"}, headers=auth)
        rid = registrant["id"]
        resp = client.patch(f"/api/registrants/{rid}", json={"email": "bob@example.com"}, headers=auth)
        assert resp.status_code == 400

    def test_update_nonexistent(self, client, auth):
        resp = client.patch("/api/registrants/99999", json={"first_name": "X"}, headers=auth)
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

class TestDeleteRegistrant:

    def test_delete_success(self, client, auth, registrant):
        rid = registrant["id"]
        resp = client.delete(f"/api/registrants/{rid}", headers=auth)
        assert resp.status_code == 204
        assert client.get(f"/api/registrants/{rid}", headers=auth).status_code == 404

    def test_delete_nonexistent(self, client, auth):
        resp = client.delete("/api/registrants/99999", headers=auth)
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# QR code
# ---------------------------------------------------------------------------

class TestQRCode:

    def test_get_qr_code(self, client, auth, registrant):
        rid = registrant["id"]
        resp = client.get(f"/api/registrants/{rid}/qr", headers=auth)
        assert resp.status_code == 200
        assert resp.json()["qr_code"] is not None

    def test_lookup_by_qr(self, client, auth, registrant):
        rid = registrant["id"]
        email = registrant["email"]
        qr_data = f"NUP:{rid}:{email}"
        resp = client.get(f"/api/registrants/lookup/by-qr?qr_data={qr_data}", headers=auth)
        assert resp.status_code == 200
        assert resp.json()["id"] == rid

    def test_lookup_by_qr_invalid_format(self, client, auth):
        resp = client.get("/api/registrants/lookup/by-qr?qr_data=badformat", headers=auth)
        assert resp.status_code == 400
