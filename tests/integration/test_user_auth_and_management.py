"""
Integration Test Suite: Autonomous User Authentication, Email Verification & Identity Management
Validates:
1. Registration with email, username, password, confirm_password, and role
2. Email verification token generation & lifecycle
3. Dual sign-in (via username OR email) + JWT issuance
4. Forgot password & secure reset token flow
5. /v1/auth/me Bearer session validation
6. Optional Google OAuth status discovery
"""

from fastapi.testclient import TestClient

from services.api.main import app
from services.security.auth_service import (
    auth_store,
    create_access_token,
    decode_access_token,
)
from services.security.pii_vault_and_rbac import TeamRole

client = TestClient(app)


def test_auth_signup_flow():
    """Verifies user registration, input validation, and verification token generation."""
    payload = {
        "username": "investor_john",
        "email": "john.doe@familyoffice.com",
        "password": "SuperSecretPassword2026!",
        "confirm_password": "SuperSecretPassword2026!",
        "role": "PRINCIPAL",
    }
    res = client.post("/v1/auth/signup", json=payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "success"
    assert "verification_token" in data
    assert data["user"]["username"] == "investor_john"
    assert data["user"]["email"] == "john.doe@familyoffice.com"
    assert data["user"]["role"] == "PRINCIPAL"
    assert data["user"]["is_verified"] is False

    # Attempting duplicate registration with same email
    res_dup_email = client.post("/v1/auth/signup", json=payload)
    assert res_dup_email.status_code == 400
    assert "already registered" in res_dup_email.json()["detail"]

    # Attempting duplicate username with different email
    payload_dup_user = {**payload, "email": "different@familyoffice.com"}
    res_dup_uname = client.post("/v1/auth/signup", json=payload_dup_user)
    assert res_dup_uname.status_code == 400
    assert "already taken" in res_dup_uname.json()["detail"]

    # Password mismatch validation
    payload_mismatch = {
        "username": "investor_mismatch",
        "email": "mismatch@test.com",
        "password": "Password123!",
        "confirm_password": "PasswordDifferent!",
        "role": "PRINCIPAL",
    }
    res_mismatch = client.post("/v1/auth/signup", json=payload_mismatch)
    assert res_mismatch.status_code == 400
    assert "do not match" in res_mismatch.json()["detail"]


def test_auth_email_verification_flow():
    """Verifies one-click cryptographic email verification token processing."""
    signup_payload = {
        "username": "counsel_clara",
        "email": "clara@advisoryfirm.com",
        "password": "LegalCompliance2026!",
        "confirm_password": "LegalCompliance2026!",
        "role": "COUNSEL",
    }
    signup_res = client.post("/v1/auth/signup", json=signup_payload).json()
    token = signup_res["verification_token"]

    # Submit verification
    verify_res = client.post("/v1/auth/verify-email", json={"token": token})
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["status"] == "success"
    assert data["user"]["is_verified"] is True

    # Replay attack / reuse of token fails
    replay_res = client.post("/v1/auth/verify-email", json={"token": token})
    assert replay_res.status_code == 400

    # Resend verification on already verified account
    resend_res = client.post("/v1/auth/resend-verification", json={"email": "clara@advisoryfirm.com"})
    assert resend_res.status_code == 400
    assert "already verified" in resend_res.json()["detail"]


def test_auth_signin_flow():
    """Verifies sign-in using both username and email, and JWT token claims."""
    # 1. Sign in with username
    res_uname = client.post(
        "/v1/auth/signin",
        json={"username_or_email": "principal", "password": "Institutional2026!"},
    )
    assert res_uname.status_code == 200
    data_uname = res_uname.json()
    assert data_uname["token_type"] == "bearer"
    assert "access_token" in data_uname
    token = data_uname["access_token"]

    # Decode and check claims
    claims = decode_access_token(token)
    assert claims["username"] == "principal"
    assert claims["role"] == "PRINCIPAL"
    assert claims["is_verified"] is True

    # 2. Sign in with email
    res_email = client.post(
        "/v1/auth/signin",
        json={"username_or_email": "principal@asup.internal", "password": "Institutional2026!"},
    )
    assert res_email.status_code == 200

    # 3. Invalid credentials
    res_bad_pwd = client.post(
        "/v1/auth/signin",
        json={"username_or_email": "principal", "password": "WrongPassword!"},
    )
    assert res_bad_pwd.status_code == 401

    res_bad_user = client.post(
        "/v1/auth/signin",
        json={"username_or_email": "ghost_user", "password": "Institutional2026!"},
    )
    assert res_bad_user.status_code == 401


def test_auth_forgot_and_reset_password_flow():
    """Verifies forgot-password token issuance and safe credential reset."""
    signup_payload = {
        "username": "cpa_marcus",
        "email": "marcus@cpafirm.com",
        "password": "OldPassword123!",
        "confirm_password": "OldPassword123!",
        "role": "CPA",
    }
    client.post("/v1/auth/signup", json=signup_payload)

    # Request password reset
    forgot_res = client.post("/v1/auth/forgot-password", json={"email": "marcus@cpafirm.com"})
    assert forgot_res.status_code == 200
    reset_token = forgot_res.json()["reset_token"]
    assert reset_token is not None

    # Reset password with valid token
    reset_payload = {
        "token": reset_token,
        "new_password": "BrandNewSecurePassword2026!",
        "confirm_password": "BrandNewSecurePassword2026!",
    }
    reset_res = client.post("/v1/auth/reset-password", json=reset_payload)
    assert reset_res.status_code == 200

    # Old password no longer works
    login_old = client.post(
        "/v1/auth/signin",
        json={"username_or_email": "marcus@cpafirm.com", "password": "OldPassword123!"},
    )
    assert login_old.status_code == 401

    # New password succeeds
    login_new = client.post(
        "/v1/auth/signin",
        json={"username_or_email": "marcus@cpafirm.com", "password": "BrandNewSecurePassword2026!"},
    )
    assert login_new.status_code == 200


def test_auth_me_endpoint():
    """Verifies /v1/auth/me session token resolution."""
    # Unauthenticated fails
    res_no_auth = client.get("/v1/auth/me")
    assert res_no_auth.status_code == 401

    # Valid token succeeds
    login_res = client.post(
        "/v1/auth/signin",
        json={"username_or_email": "analyst", "password": "Institutional2026!"},
    ).json()
    token = login_res["access_token"]

    res_me = client.get("/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    me_data = res_me.json()
    assert me_data["user"]["username"] == "analyst"
    assert me_data["user"]["role"] == "ANALYST"


def test_oauth_providers_endpoint():
    """Verifies optional OAuth providers discovery endpoint."""
    res = client.get("/v1/auth/oauth/providers")
    assert res.status_code == 200
    data = res.json()
    assert "google" in data
    assert "microsoft" in data
    assert "enabled" in data["google"]
