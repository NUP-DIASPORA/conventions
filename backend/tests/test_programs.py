"""
Tests for /api/programs — CRUD, public access, date filtering.
"""
import pytest
from tests.conftest import create_admin, get_auth_headers


SESSION_BASE = {
    "title": "Opening Keynote",
    "description": "Welcome everyone.",
    "session_date": "2026-08-13",
    "start_time": "09:00:00",
    "end_time": "10:00:00",
    "location": "Main Hall",
    "session_type": "talk",
    "is_public": True,
}


@pytest.fixture
def auth(client, db_session):
    create_admin(db_session)
    return get_auth_headers(client)


@pytest.fixture
def session(client, auth):
    resp = client.post("/api/programs", json=SESSION_BASE, headers=auth)
    assert resp.status_code == 201
    return resp.json()


class TestProgramPublicAccess:

    def test_list_sessions_public(self, client, session):
        resp = client.get("/api/programs")
        assert resp.status_code == 200
        assert any(s["title"] == "Opening Keynote" for s in resp.json())

    def test_private_sessions_excluded(self, client, auth):
        client.post("/api/programs", json={**SESSION_BASE, "title": "Private", "is_public": False}, headers=auth)
        resp = client.get("/api/programs")
        assert all(s["title"] != "Private" for s in resp.json())

    def test_filter_by_date(self, client, auth):
        client.post("/api/programs", json={**SESSION_BASE, "session_date": "2026-08-13"}, headers=auth)
        client.post("/api/programs", json={**SESSION_BASE, "session_date": "2026-08-14"}, headers=auth)
        resp = client.get("/api/programs?session_date=2026-08-13")
        assert all(s["session_date"] == "2026-08-13" for s in resp.json())

    def test_get_session_by_id(self, client, session):
        resp = client.get(f"/api/programs/{session['id']}")
        assert resp.status_code == 200
        assert resp.json()["title"] == "Opening Keynote"

    def test_get_session_not_found(self, client):
        assert client.get("/api/programs/99999").status_code == 404


class TestProgramCRUD:

    def test_create_session(self, client, auth):
        resp = client.post("/api/programs", json=SESSION_BASE, headers=auth)
        assert resp.status_code == 201
        assert resp.json()["title"] == "Opening Keynote"

    def test_create_requires_auth(self, client):
        assert client.post("/api/programs", json=SESSION_BASE).status_code == 401

    def test_create_session_with_speaker(self, client, auth):
        # Create a speaker first
        speaker = client.post("/api/speakers", json={
            "first_name": "John", "last_name": "Speaker",
        }, headers=auth).json()
        resp = client.post("/api/programs", json={
            **SESSION_BASE, "speaker_id": speaker["id"]
        }, headers=auth)
        assert resp.status_code == 201
        assert resp.json()["speaker"]["last_name"] == "Speaker"

    def test_update_session(self, client, auth, session):
        resp = client.patch(f"/api/programs/{session['id']}", json={"title": "Updated Title"}, headers=auth)
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"

    def test_update_nonexistent(self, client, auth):
        assert client.patch("/api/programs/99999", json={"title": "X"}, headers=auth).status_code == 404

    def test_update_requires_auth(self, client, session):
        assert client.patch(f"/api/programs/{session['id']}", json={"title": "X"}).status_code == 401

    def test_delete_session(self, client, auth, session):
        sid = session["id"]
        assert client.delete(f"/api/programs/{sid}", headers=auth).status_code == 204
        assert client.get(f"/api/programs/{sid}").status_code == 404

    def test_delete_nonexistent(self, client, auth):
        assert client.delete("/api/programs/99999", headers=auth).status_code == 404

    def test_sessions_ordered_by_date_and_time(self, client, auth):
        client.post("/api/programs", json={**SESSION_BASE, "session_date": "2026-08-14", "start_time": "09:00:00"}, headers=auth)
        client.post("/api/programs", json={**SESSION_BASE, "session_date": "2026-08-13", "start_time": "14:00:00"}, headers=auth)
        resp = client.get("/api/programs")
        sessions = resp.json()
        dates = [s["session_date"] for s in sessions]
        assert dates == sorted(dates)
