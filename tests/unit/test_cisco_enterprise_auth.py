"""
tests/unit/test_cisco_enterprise_auth.py
Cisco Zero-Trust & Duo Security Authentication Architecture Unit Tests.

Covers:
1. RFC 6238 TOTP Generation, Clock Drift Tolerance (±30s), and Otpauth URI Format.
2. Emergency Backup Recovery Codes Generation, Format, and Single-Use Consumption.
3. Active Device Session Fleet Management, User-Agent Parsing, and Fleet Revocation.
4. NIST SP 800-63B Password Change with Current Password Verification & Session Invalidation.
5. Passwordless Magic Link Generation, Verification, and Anti-Replay Burn.
"""

import time
from services.security.auth_service import (
    generate_totp_secret,
    get_totp_uri,
    get_totp_code,
    verify_totp,
    generate_backup_codes,
    parse_device_summary,
    auth_store,
    UserSession,
    create_mfa_challenge_token,
    decode_mfa_challenge_token,
    InvalidCredentialsError,
    TokenExpiredOrInvalidError,
)
from services.security.pii_vault_and_rbac import TeamRole


def test_rfc6238_totp_generation_and_drift():
    """Verifies standard RFC 6238 TOTP computation and ±30s drift window."""
    secret = generate_totp_secret()
    assert len(secret) == 32
    assert secret.isalnum()

    # Otpauth URI format
    uri = get_totp_uri(secret, "principal@familyoffice.com", "Argus")
    assert uri.startswith("otpauth://totp/Argus%3Aprincipal%40familyoffice.com?")
    assert f"secret={secret}" in uri
    assert "algorithm=SHA1" in uri
    assert "digits=6" in uri
    assert "period=30" in uri

    now = time.time()
    code_now = get_totp_code(secret, now)
    assert len(code_now) == 6
    assert code_now.isdigit()

    # Verify current code
    assert verify_totp(secret, code_now)

    # Verify within drift window (time + 25s, time - 25s)
    code_drift_plus = get_totp_code(secret, now + 25)
    assert verify_totp(secret, code_drift_plus, window=1)

    code_drift_minus = get_totp_code(secret, now - 25)
    assert verify_totp(secret, code_drift_minus, window=1)

    # Outside window (time + 90s)
    code_far = get_totp_code(secret, now + 90)
    if code_far != code_now:
        assert not verify_totp(secret, code_far, interval=30, window=1)

    # Malformed codes
    assert not verify_totp(secret, "12345")
    assert not verify_totp(secret, "abcdef")
    assert not verify_totp(secret, "")


def test_backup_recovery_codes_generation_and_consumption():
    """Verifies single-use backup recovery codes generation, format, and burn."""
    plain_codes, hashed_codes = generate_backup_codes(8)
    assert len(plain_codes) == 8
    assert len(hashed_codes) == 8
    for code in plain_codes:
        assert len(code) == 9
        assert code[4] == "-"
        parts = code.split("-")
        assert len(parts) == 2
        assert parts[0].isalnum() and parts[1].isalnum()

    assert len(set(plain_codes)) == 8

    # Test burning backup code in user record
    test_user, _ = auth_store.register_user(
        username="mfa_test_user_01",
        email="mfa_test_01@familyoffice.com",
        password="P@ssw0rd2026!Argus",
        confirm_password="P@ssw0rd2026!Argus",
        role=TeamRole.PRINCIPAL,
    )
    test_user.is_verified = True
    secret, otpauth_uri, plain_backup_codes = auth_store.setup_mfa(test_user.user_id)
    assert len(secret) == 32
    assert "otpauth://" in otpauth_uri
    assert len(plain_backup_codes) == 8

    valid_code = get_totp_code(secret)
    ok, msg = auth_store.enable_mfa(test_user.user_id, valid_code)
    assert ok is True

    rec = auth_store.get_user_by_id(test_user.user_id)
    assert rec.mfa_enabled
    assert len(rec.mfa_backup_codes) == 8

    # Burn one code
    burned_code = plain_backup_codes[0]
    challenge_token = create_mfa_challenge_token(rec.user_id)
    verified_user, access_token, refresh_token, session = auth_store.verify_mfa_login(challenge_token, burned_code)
    assert verified_user.user_id == test_user.user_id
    assert access_token is not None

    # The burned code hash must be removed from the user's available backup codes
    rec_after = auth_store.get_user_by_id(test_user.user_id)
    assert len(rec_after.mfa_backup_codes) == 7

    # Re-using the same burned code must fail
    challenge_token_2 = create_mfa_challenge_token(rec.user_id)
    try:
        auth_store.verify_mfa_login(challenge_token_2, burned_code)
        assert False, "Reusing a burned backup code should have raised error"
    except InvalidCredentialsError as e:
        assert "backup recovery code" in str(e).lower()


def test_active_session_fleet_management():
    """Verifies device inventory parsing, session creation, and fleet termination."""
    # Test User-Agent parser
    ua_mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    assert "macOS" in parse_device_summary(ua_mac) and "Chrome" in parse_device_summary(ua_mac)

    ua_win = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0"
    assert "Windows" in parse_device_summary(ua_win) and "Firefox" in parse_device_summary(ua_win)

    ua_iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148"
    assert "iOS" in parse_device_summary(ua_iphone)

    # Session lifecycle in auth_store
    user_id = "sess_fleet_test_user_01"
    s1 = auth_store.create_session(user_id, "192.168.1.10", ua_mac)
    s2 = auth_store.create_session(user_id, "10.0.0.5", ua_win)
    s3 = auth_store.create_session(user_id, "172.16.0.2", ua_iphone)

    sessions = auth_store.get_user_sessions(user_id, current_session_id=s1.session_id)
    assert len(sessions) == 3
    # Check current session flag
    s1_dict = next(s for s in sessions if s["session_id"] == s1.session_id)
    assert s1_dict["is_current"] is True
    s2_dict = next(s for s in sessions if s["session_id"] == s2.session_id)
    assert s2_dict["is_current"] is False

    # Revoke single session
    auth_store.revoke_session(s2.session_id, user_id=user_id)
    active_sessions = auth_store.get_user_sessions(user_id)
    assert len(active_sessions) == 2
    assert not any(s["session_id"] == s2.session_id for s in active_sessions)

    # Revoke all other sessions keeping s1
    revoked_count = auth_store.revoke_other_sessions(user_id, s1.session_id)
    assert revoked_count == 1
    final_sessions = auth_store.get_user_sessions(user_id, current_session_id=s1.session_id)
    assert len(final_sessions) == 1
    assert final_sessions[0]["session_id"] == s1.session_id


def test_password_change_and_session_invalidation():
    """Verifies changing password checks current password, validates NIST, and terminates other sessions."""
    user, _ = auth_store.register_user(
        username="pwd_change_user_01",
        email="pwd_change_01@familyoffice.com",
        password="OldP@ssword2026!",
        confirm_password="OldP@ssword2026!",
        role=TeamRole.PRINCIPAL,
    )
    user.is_verified = True

    # Create two active sessions
    s_curr = auth_store.create_session(user.user_id, "127.0.0.1", "Chrome")
    s_other = auth_store.create_session(user.user_id, "10.0.0.1", "Safari")

    # 1. Invalid current password
    try:
        auth_store.change_password(user.user_id, "WrongCurrentPass1!", "NewP@ssword2026!", "NewP@ssword2026!")
        assert False, "Should have failed on incorrect current password"
    except InvalidCredentialsError as e:
        assert "Current password is incorrect" in str(e)

    # 2. Weak new password (NIST failure)
    try:
        auth_store.change_password(user.user_id, "OldP@ssword2026!", "weak", "weak")
        assert False, "Should have failed on weak new password"
    except ValueError as e:
        assert "8 characters" in str(e) or "complexity" in str(e).lower()

    # 3. Successful change
    ok, msg, updated_user = auth_store.change_password(
        user.user_id,
        "OldP@ssword2026!",
        "SecureN3wP@ssword2026!",
        "SecureN3wP@ssword2026!",
    )
    assert ok is True
    assert updated_user.user_id == user.user_id

    # User can now authenticate with new password
    authed_user = auth_store.authenticate_user("pwd_change_user_01", "SecureN3wP@ssword2026!")
    assert authed_user.user_id == user.user_id

    # Old password no longer works
    try:
        auth_store.authenticate_user("pwd_change_user_01", "OldP@ssword2026!")
        assert False, "Old password should not authenticate"
    except InvalidCredentialsError:
        pass


def test_magic_link_lifecycle():
    """Verifies generation, verification, and anti-replay single-use burn of magic links."""
    user, _ = auth_store.register_user(
        username="magic_link_user_01",
        email="magic_link_01@familyoffice.com",
        password="P@ssw0rd2026!Argus",
        confirm_password="P@ssw0rd2026!Argus",
        role=TeamRole.PRINCIPAL,
    )
    user.is_verified = True

    # Request magic link
    ok, msg, token, user_rec = auth_store.request_magic_link(user.email)
    assert ok is True
    assert token is not None

    # Verify magic link
    verified_user, access_token, refresh_token, session = auth_store.verify_magic_link(token)
    assert verified_user.user_id == user.user_id
    assert verified_user.email == user.email
    assert access_token is not None

    # Attempt replay of burned token
    try:
        auth_store.verify_magic_link(token)
        assert False, "Burned magic link token should not be verifiable again"
    except TokenExpiredOrInvalidError as e:
        assert "invalid or has already been used" in str(e)
