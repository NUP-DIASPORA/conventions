"""
Tests for /api/speakers — CRUD, public vs auth access.
"""
import pytest
from tests.conftest import create_admin, get_auth_headers


SPEAKER_BASE = {
    "first_name": "Jane",
    "last_name": "Doe",
    "title": "Dr.",
    "bio": "A great speaker.",
    "organization": "NUP",
    "country": "Uganda",
    "is_keynote": False,
}


@pytest.fixture
def auth(client, db_session):
    create_admin(db_session)
    return get_auth_headers(client)


@pytest.fixture
def speaker(client, auth):
    resp = client.post("/api/speakers", json=SPEAKER_BASE, headers=auth)
    assert resp.status_code == 201
    return resp.json()


class TestSpeakerPublicAccess:

    def test_list_speakers_public(self, client, speaker):
        resp = client.get("/api/speakers")
        assert resp.status_code == 200
        assert any(s["last_name"] == "Doe" for s in resp.json())

    def test_get_speaker_public(self, client, speaker):
        resp = client.get(f"/api/speakers/{speaker['id']}")
        assert resp.status_code == 200
        assert resp.json()["last_name"] == "Doe"

    def test_get_speaker_not_found(self, client):
        assert client.get("/api/speakers/99999").status_code == 404


class TestSpeakerCRUD:

    def test_create_speaker(self, client, auth):
        resp = client.post("/api/speakers", json=SPEAKER_BASE, headers=auth)
        assert resp.status_code == 201
        assert resp.json()["last_name"] == "Doe"

    def test_create_keynote_speaker(self, client, auth):
        resp = client.post("/api/speakers", json={**SPEAKER_BASE, "is_keynote": True}, headers=auth)
        assert resp.json()["is_keynote"] is True

    def test_create_requires_auth(self, client):
        assert client.post("/api/speakers", json=SPEAKER_BASE).status_code == 401

    def test_update_speaker(self, client, auth, speaker):
        resp = client.patch(f"/api/speakers/{speaker['id']}", json={"title": "Prof."}, headers=auth)
        assert resp.status_code == 200
        assert resp.json()["title"] == "Prof."

    def test_update_nonexistent(self, client, auth):
        assert client.patch("/api/speakers/99999", json={"title": "X"}, headers=auth).status_code == 404

    def test_update_requires_auth(self, client, speaker):
        assert client.patch(f"/api/speakers/{speaker['id']}", json={"title": "X"}).status_code == 401

    def test_delete_speaker(self, client, auth, speaker):
        sid = speaker["id"]
        assert client.delete(f"/api/speakers/{sid}", headers=auth).status_code == 204
        assert client.get(f"/api/speakers/{sid}").status_code == 404

    def test_delete_nonexistent(self, client, auth):
        assert client.delete("/api/speakers/99999", headers=auth).status_code == 404

    def test_keynote_speakers_sorted_first(self, client, auth):
        client.post("/api/speakers", json={**SPEAKER_BASE, "last_name": "Regular", "is_keynote": False}, headers=auth)
        client.post("/api/speakers", json={**SPEAKER_BASE, "last_name": "Keynote", "is_keynote": True}, headers=auth)
        resp = client.get("/api/speakers")
        speakers = resp.json()
        # Keynote should appear before non-keynote
        keynote_idx = next(i for i, s in enumerate(speakers) if s["last_name"] == "Keynote")
        regular_idx = next(i for i, s in enumerate(speakers) if s["last_name"] == "Regular")
        assert keynote_idx < regular_idx
