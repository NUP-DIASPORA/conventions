"""
Tests for /api/auth — login, register, /me, change-password.
"""
import pytest
from tests.conftest import create_admin, get_auth_headers, ADMIN_EMAIL, ADMIN_PASSWORD


class TestLogin:

    def test_login_success(self, client, db_session):
        create_admin(db_session)
        resp = client.post("/api/auth/login", data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"

    def test_login_wrong_password(self, client, db_session):
        create_admin(db_session)
        resp = client.post("/api/auth/login", data={"username": ADMIN_EMAIL, "password": "wrongpassword"})
        assert resp.status_code == 401

    def test_login_unknown_email(self, client):
        resp = client.post("/api/auth/login", data={"username": "nobody@test.com", "password": "x"})
        assert resp.status_code == 401

    def test_login_inactive_admin_rejected(self, client, db_session):
        admin = create_admin(db_session)
        admin.is_active = False
        db_session.commit()
        resp = client.post("/api/auth/login", data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        # Login itself succeeds (we only check is_active on get_current_admin),
        # but the token will be rejected on protected routes.
        token = resp.json().get("access_token")
        me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 401


class TestGetMe:

    def test_get_me_returns_admin(self, client, db_session):
        create_admin(db_session)
        headers = get_auth_headers(client)
        resp = client.get("/api/auth/me", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == ADMIN_EMAIL

    def test_get_me_unauthenticated(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_get_me_invalid_token(self, client):
        resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalidtoken"})
        assert resp.status_code == 401


class TestRegisterAdmin:

    def test_register_new_admin(self, client, db_session):
        create_admin(db_session)
        headers = get_auth_headers(client)
        resp = client.post("/api/auth/register", json={
            "email": "new@test.com",
            "full_name": "New Admin",
            "password": "newpass123",
        }, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == "new@test.com"

    def test_register_duplicate_email_rejected(self, client, db_session):
        create_admin(db_session)
        headers = get_auth_headers(client)
        client.post("/api/auth/register", json={
            "email": "dup@test.com", "full_name": "A", "password": "pass123"
        }, headers=headers)
        resp = client.post("/api/auth/register", json={
            "email": "dup@test.com", "full_name": "B", "password": "pass123"
        }, headers=headers)
        assert resp.status_code == 400

    def test_register_requires_auth(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "x@test.com", "full_name": "X", "password": "pass"
        })
        assert resp.status_code == 401


class TestChangePassword:

    def test_change_password_success(self, client, db_session):
        create_admin(db_session)
        headers = get_auth_headers(client)
        resp = client.post("/api/auth/change-password", json={
            "current_password": ADMIN_PASSWORD,
            "new_password": "newpass456",
        }, headers=headers)
        assert resp.status_code == 200

        # Old password should no longer work
        resp2 = client.post("/api/auth/login", data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert resp2.status_code == 401

        # New password should work
        resp3 = client.post("/api/auth/login", data={"username": ADMIN_EMAIL, "password": "newpass456"})
        assert resp3.status_code == 200

    def test_change_password_wrong_current(self, client, db_session):
        create_admin(db_session)
        headers = get_auth_headers(client)
        resp = client.post("/api/auth/change-password", json={
            "current_password": "wrongcurrent",
            "new_password": "doesntmatter",
        }, headers=headers)
        assert resp.status_code == 400
