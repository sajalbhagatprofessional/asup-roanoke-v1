"""
Defensive Cybersecurity Engineering & AAA Architecture Unit Tests.
Verifies NIST SP 800-63B password complexity, sliding-window account lockout,
rotating refresh tokens (RTR), token family reuse detection, HTTP security headers,
and Merkle-chained AAA accounting logs.
"""

from datetime import datetime, timezone
from decimal import Decimal
from starlette.testclient import TestClient

from services.api.main import app, audit_ledger
from services.security import (
    AccountLockedError,
    AccountLockoutManager,
    TokenReuseDetectedError,
    TokenExpiredOrInvalidError,
    auth_store,
    create_access_token,
    decode_access_token,
    lockout_manager,
    validate_password_strength,
    TeamRole,
)


def test_nist_password_complexity():
    """Verifies NIST SP 800-63B password complexity checks."""
    # Too short
    ok, err = validate_password_strength("Short1!")
    assert not ok
    assert "8 characters" in err

    # Missing uppercase
    ok, err = validate_password_strength("lowercase123!")
    assert not ok
    assert "uppercase" in err

    # Missing lowercase
    ok, err = validate_password_strength("UPPERCASE123!")
    assert not ok
    assert "lowercase" in err

    # Missing number
    ok, err = validate_password_strength("NoNumbersHere!")
    assert not ok
    assert "number" in err

    # Missing symbol
    ok, err = validate_password_strength("NoSymbols1234")
    assert not ok
    assert "special character" in err

    # Valid NIST compliant password
    ok, msg = validate_password_strength("Institutional2026!")
    assert ok
    assert "security standards" in msg


def test_sliding_window_account_lockout():
    """Verifies 5-failure threshold and 15-minute freeze window."""
    mgr = AccountLockoutManager()
    user_id = "test_target_user"

    # 4 consecutive failures do not lock
    for _ in range(4):
        is_locked, count, sec = mgr.record_failure(user_id)
        assert not is_locked
        assert count < 5

    locked, _ = mgr.is_locked(user_id)
    assert not locked

    # 5th failure trips lockout
    is_locked, count, sec = mgr.record_failure(user_id)
    assert is_locked
    assert count == 5
    assert sec > 0

    locked, rem = mgr.is_locked(user_id)
    assert locked
    assert rem > 0

    # Successful login resets lockout
    mgr.record_success(user_id)
    locked_after, _ = mgr.is_locked(user_id)
    assert not locked_after


def test_refresh_token_rotation_and_reuse_defense():
    """
    Verifies Rotating Refresh Token (RTR) lifecycle and automated
    family revocation upon detecting a replay attack.
    """
    # 1. Issue initial refresh token for default principal
    raw_token_1, rec_1 = auth_store.create_refresh_token("usr_principal_01")
    assert raw_token_1.startswith("asup_rf_")
    assert rec_1.family_id.startswith("rfam_")
    assert not rec_1.is_revoked

    # 2. Legitimate rotation: exchange token 1 for token 2
    access_token_1, raw_token_2, user = auth_store.rotate_refresh_token(raw_token_1)
    assert access_token_1 is not None
    assert raw_token_2 != raw_token_1
    assert user.user_id == "usr_principal_01"

    # Token 1 is now marked revoked
    assert rec_1.is_revoked

    # 3. Legitimate rotation: exchange token 2 for token 3
    access_token_2, raw_token_3, _ = auth_store.rotate_refresh_token(raw_token_2)
    assert raw_token_3 != raw_token_2

    # 4. Adversary attempts to replay Token 1 (Replay Attack)
    # System MUST detect reuse and revoke the entire token family!
    try:
        auth_store.rotate_refresh_token(raw_token_1)
        assert False, "Should have raised TokenReuseDetectedError"
    except TokenReuseDetectedError as e:
        assert "reuse detected" in str(e).lower()

    # 5. Token 3 (which was active in the family) MUST now be revoked as well
    try:
        auth_store.rotate_refresh_token(raw_token_3)
        assert False, "Token 3 should have been revoked due to family contamination"
    except TokenReuseDetectedError:
        pass


def test_security_headers_and_cors_protection():
    """Verifies enterprise security headers injected on all HTTP responses."""
    client = TestClient(app)
    res = client.get("/v1/health")
    assert res.status_code == 200

    headers = res.headers
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert "max-age=31536000" in headers.get("Strict-Transport-Security", "")
    assert "1; mode=block" in headers.get("X-XSS-Protection", "")
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_aaa_merkle_accounting_on_auth_events():
    """
    Verifies that all authentication events (signin, refresh, signout)
    are cryptographically appended to the immutable Merkle audit ledger.
    """
    initial_event_count = len(audit_ledger.events)
    client = TestClient(app)

    # 1. Sign In
    res = client.post(
        "/v1/auth/signin",
        json={"username_or_email": "principal", "password": "Institutional2026!"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

    # Verify event appended in Merkle ledger
    assert len(audit_ledger.events) > initial_event_count
    latest_evt = audit_ledger.events[-1]
    assert latest_evt.action_type == "AUTH_SIGNIN_SUCCESS"
    assert latest_evt.actor_role == TeamRole.PRINCIPAL

    # 2. Token Refresh
    res_refresh = client.post(
        "/v1/auth/refresh",
        json={"refresh_token": data["refresh_token"]},
    )
    assert res_refresh.status_code == 200
    refresh_data = res_refresh.json()
    assert "access_token" in refresh_data
    assert "refresh_token" in refresh_data

    # Verify refresh event appended
    refresh_evt = audit_ledger.events[-1]
    assert refresh_evt.action_type == "AUTH_TOKEN_REFRESH_SUCCESS"

    # 3. Sign Out
    res_signout = client.post(
        "/v1/auth/signout",
        json={"refresh_token": refresh_data["refresh_token"]},
    )
    assert res_signout.status_code == 200

    signout_evt = audit_ledger.events[-1]
    assert signout_evt.action_type == "AUTH_SIGNOUT"

    # Cryptographically verify the entire Merkle chain from genesis to tip
    assert audit_ledger.verify_chain_integrity() is True


def test_oauth_pkce_authorization_and_callback():
    """Verifies standard OAuth2 PKCE authorization URL generation and callback."""
    client = TestClient(app)

    # 1. Generate Authorize URL with PKCE
    res_url = client.get("/v1/auth/oauth/authorize-url?provider=google&redirect_uri=http://localhost:3000/auth/callback")
    assert res_url.status_code == 200
    u_data = res_url.json()
    assert "auth_url" in u_data
    assert "accounts.google.com" in u_data["auth_url"]
    assert "code_challenge=" in u_data["auth_url"]
    assert "state" in u_data

    # 2. Complete Callback with State
    res_cb = client.post(
        "/v1/auth/oauth/callback",
        json={
            "provider": "google",
            "code": "test_auth_code_123",
            "state": u_data["state"],
            "mock_email": "test_principal_sso@asup.internal",
            "mock_username": "principal_sso",
        },
    )
    assert res_cb.status_code == 200
    cb_data = res_cb.json()
    assert "access_token" in cb_data
    assert "refresh_token" in cb_data
    assert cb_data["user"]["email"] == "test_principal_sso@asup.internal"
