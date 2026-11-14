"""
Unit Tests for Real Email Delivery & 6-Digit Code Verification Service.
Verifies SMTP configuration parsing, fallback outbox logging, 6-digit verification code
handling, and anti-replay invalidation.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
from starlette.testclient import TestClient

from services.api.main import app
from services.security import (
    UserAuthStore,
    auth_store,
    email_service,
    TeamRole,
)


def test_email_service_outbox_persistence_and_status():
    """Verifies that transactional emails persist to the local outbox log when SMTP is not configured."""
    client = TestClient(app)

    # 1. Check email status endpoint
    res = client.get("/v1/auth/email/status")
    assert res.status_code == 200
    data = res.json()
    assert "channel" in data
    assert "dispatched_emails_count" in data
    assert "from_email" in data

    # 2. Test sending verification email directly
    dispatch_res = email_service.send_verification_email(
        to_email="test.principal@roanokepartners.com",
        username="principal_tester",
        code="784912",
        token="mock_vtoken_test_12345",
        base_url="http://localhost:3000",
    )
    assert dispatch_res["recipient"] == "test.principal@roanokepartners.com"
    assert "784912" in dispatch_res["subject"]
    assert dispatch_res["meta"]["code"] == "784912"

    # Verify written to persistent log
    outbox_path = Path(email_service.get_status()["outbox_log_path"])
    assert outbox_path.exists()
    records = json.loads(outbox_path.read_text(encoding="utf-8"))
    assert len(records) > 0
    latest = records[-1]
    assert latest["to"] == "test.principal@roanokepartners.com"
    assert "784912" in latest["meta"]["code"]


def test_six_digit_code_registration_and_verification():
    """
    Verifies that registering a user generates a 6-digit verification code,
    and the user can verify their account by submitting EITHER the 6-digit code OR token.
    """
    client = TestClient(app)

    signup_payload = {
        "username": "investor_sarah",
        "email": "sarah.capital@vault.internal",
        "password": "SecurePassword2026!",
        "confirm_password": "SecurePassword2026!",
        "role": "PRINCIPAL",
    }
    res_signup = client.post("/v1/auth/signup", json=signup_payload)
    assert res_signup.status_code == 200
    data = res_signup.json()

    # Verify response carries 6-digit code and delivery info
    assert "verification_code" in data
    v_code = data["verification_code"]
    assert len(v_code) == 6
    assert v_code.isdigit()
    assert "email_delivery" in data

    # 1. Verify using the 6-digit numeric code directly
    res_verify = client.post("/v1/auth/verify-email", json={"token": v_code})
    assert res_verify.status_code == 200
    verify_data = res_verify.json()
    assert verify_data["status"] == "success"
    assert verify_data["user"]["is_verified"] is True

    # 2. Replay attack: submitting the code again MUST fail
    res_replay = client.post("/v1/auth/verify-email", json={"token": v_code})
    assert res_replay.status_code == 400
    assert "invalid or has already been used" in res_replay.json()["detail"].lower()

    # 3. The associated token must also be invalidated
    v_token = data["verification_token"]
    res_token_replay = client.post("/v1/auth/verify-email", json={"token": v_token})
    assert res_token_replay.status_code == 400


def test_resend_verification_dispatches_new_six_digit_code():
    """Verifies that resend-verification issues a fresh 6-digit code and invalidates previous codes."""
    client = TestClient(app)

    signup_payload = {
        "username": "unverified_analyst",
        "email": "analyst.unverified@firm.com",
        "password": "SecurePassword2026!",
        "confirm_password": "SecurePassword2026!",
        "role": "ANALYST",
    }
    res_signup = client.post("/v1/auth/signup", json=signup_payload)
    assert res_signup.status_code == 200
    first_code = res_signup.json()["verification_code"]

    # Request resend
    res_resend = client.post("/v1/auth/resend-verification", json={"email": "analyst.unverified@firm.com"})
    assert res_resend.status_code == 200
    resend_data = res_resend.json()
    second_code = resend_data["verification_code"]
    assert len(second_code) == 6
    assert second_code.isdigit()

    # Old code should no longer work
    res_old = client.post("/v1/auth/verify-email", json={"token": first_code})
    assert res_old.status_code == 400

    # New code verifies successfully
    res_new = client.post("/v1/auth/verify-email", json={"token": second_code})
    assert res_new.status_code == 200
    assert res_new.json()["user"]["is_verified"] is True
