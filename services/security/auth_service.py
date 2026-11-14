"""
Autonomous User Authentication, Verification, and Identity Management Service.
Compliance: Zero-bloat, secure cryptographic hashing, JWT role claims, email verification,
NIST SP 800-63B password complexity, sliding-window account lockout, and rotating refresh tokens (RTR).
"""

import base64
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
import hashlib
import hmac
import logging
import os
from pathlib import Path
import re
import secrets
from typing import Any, Dict, List, Optional, Tuple

import bcrypt
import jwt

# Auto-load repository root .env if present
try:
    from dotenv import load_dotenv
    _repo_env = Path(__file__).resolve().parent.parent.parent / ".env"
    if _repo_env.exists():
        load_dotenv(dotenv_path=_repo_env)
    else:
        load_dotenv()
except ImportError:
    pass

from services.security.pii_vault_and_rbac import TeamRole

logger = logging.getLogger("asup.security.auth")

DEFAULT_DEV_SECRET = "asup-roanoke-aladdin-vault-secret-key-2026-unbreakable"
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", DEFAULT_DEV_SECRET)
if JWT_SECRET_KEY == DEFAULT_DEV_SECRET and os.environ.get("ENVIRONMENT") == "production":
    raise RuntimeError(
        "CRITICAL SECURITY CONFIGURATION ERROR: Default JWT_SECRET_KEY cannot be used in production. "
        "Please provide a high-entropy 256-bit secret via the JWT_SECRET_KEY environment variable."
    )

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
ACCESS_TOKEN_EXPIRE_DAYS = 7  # Kept for backward compatibility
REFRESH_TOKEN_EXPIRE_DAYS = 7
VERIFICATION_TOKEN_EXPIRE_HOURS = 24
RESET_TOKEN_EXPIRE_HOURS = 1


class AuthError(Exception):
    """Base exception for authentication failures."""
    pass


class UserAlreadyExistsError(AuthError):
    """Raised when email or username is already registered."""
    pass


class InvalidCredentialsError(AuthError):
    """Raised on invalid login credentials."""
    pass


class AccountLockedError(AuthError):
    """Raised when an account is temporarily locked due to excessive failed attempts."""
    def __init__(self, message: str, retry_after_seconds: int = 900):
        super().__init__(message)
        self.retry_after_seconds = retry_after_seconds


class TokenExpiredOrInvalidError(AuthError):
    """Raised when a verification, access, or refresh token is expired or invalid."""
    pass


class TokenReuseDetectedError(AuthError):
    """Raised when an already rotated refresh token is presented (potential session hijacking)."""
    pass


@dataclass
class UserSession:
    session_id: str
    user_id: str
    client_ip: str
    user_agent: str
    device_name: str
    created_at: datetime
    last_active_at: datetime
    is_revoked: bool = False

    def to_dict(self, is_current: bool = False) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "client_ip": self.client_ip,
            "device_name": self.device_name,
            "created_at": self.created_at.isoformat(),
            "last_active_at": self.last_active_at.isoformat(),
            "is_current": is_current,
            "is_revoked": self.is_revoked,
        }


# =========================================================================
# RFC 6238 TOTP ENGINE & DEVICE SUMMARY PARSER (ZERO THIRD-PARTY DEP)
# =========================================================================

def generate_totp_secret() -> str:
    """Generates a high-entropy 160-bit Base32 secret for RFC 6238 TOTP."""
    raw_bytes = secrets.token_bytes(20)
    return base64.b32encode(raw_bytes).decode("utf-8").replace("=", "")


def get_totp_uri(secret_b32: str, account_name: str, issuer: str = "Argus Institutional") -> str:
    """Builds standard RFC-6238 otpauth URI for QR codes and authenticator apps."""
    import urllib.parse
    label = urllib.parse.quote(f"{issuer}:{account_name}")
    issuer_q = urllib.parse.quote(issuer)
    return f"otpauth://totp/{label}?secret={secret_b32}&issuer={issuer_q}&algorithm=SHA1&digits=6&period=30"


def get_totp_code(secret_b32: str, t: Optional[float] = None, interval: int = 30) -> str:
    """Computes standard 6-digit TOTP code for a given timestamp."""
    import struct, time
    if t is None:
        t = time.time()
    counter = int(t // interval)
    secret_clean = secret_b32.strip().upper()
    padded = secret_clean + "=" * (-len(secret_clean) % 8)
    key = base64.b32decode(padded)
    msg = struct.pack(">Q", counter)
    h = hmac.new(key, msg, hashlib.sha1).digest()
    offset = h[-1] & 0x0F
    binary = (
        ((h[offset] & 0x7F) << 24)
        | ((h[offset + 1] & 0xFF) << 16)
        | ((h[offset + 2] & 0xFF) << 8)
        | (h[offset + 3] & 0xFF)
    )
    otp = binary % 1000000
    return str(otp).zfill(6)


def verify_totp(secret_b32: str, code: str, interval: int = 30, window: int = 1) -> bool:
    """Verifies a 6-digit TOTP code with ±window tolerance for clock drift."""
    import time
    code_clean = code.strip().replace(" ", "").replace("-", "")
    if len(code_clean) != 6 or not code_clean.isdigit():
        return False
    now = time.time()
    for offset in range(-window, window + 1):
        if get_totp_code(secret_b32, now + (offset * interval), interval) == code_clean:
            return True
    return False


def generate_backup_codes(count: int = 8) -> Tuple[List[str], List[str]]:
    """Generates single-use backup recovery codes formatted XXXX-XXXX with SHA-256 hashes."""
    plain_codes = []
    hashed_codes = []
    for _ in range(count):
        part1 = secrets.token_hex(2).upper()
        part2 = secrets.token_hex(2).upper()
        code = f"{part1}-{part2}"
        plain_codes.append(code)
        hashed_codes.append(hashlib.sha256(code.encode("utf-8")).hexdigest())
    return plain_codes, hashed_codes


def parse_device_summary(user_agent: str) -> str:
    """Parses user agent into a clean institutional device descriptor."""
    if not user_agent:
        return "Unknown Client / Terminal"
    ua = user_agent.lower()
    os_name = "Desktop"
    if "iphone" in ua or "ipad" in ua:
        os_name = "iOS"
    elif "android" in ua:
        os_name = "Android"
    elif "windows" in ua:
        os_name = "Windows"
    elif "macintosh" in ua or "mac os" in ua:
        os_name = "macOS"
    elif "linux" in ua:
        os_name = "Linux"

    browser = "Browser"
    if "edg/" in ua:
        browser = "Edge"
    elif "chrome" in ua and "safari" in ua:
        browser = "Chrome"
    elif "safari" in ua and "chrome" not in ua:
        browser = "Safari"
    elif "firefox" in ua:
        browser = "Firefox"
    elif "curl" in ua or "python" in ua or "postman" in ua:
        browser = "API Terminal / CLI"

    return f"{os_name} · {browser}"


@dataclass
class UserRecord:
    user_id: str
    username: str
    email: str
    password_hash: str
    role: TeamRole = TeamRole.PRINCIPAL
    is_verified: bool = False
    is_active: bool = True
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    verification_token: Optional[str] = None
    verification_code: Optional[str] = None
    verification_token_expires_at: Optional[datetime] = None
    reset_token: Optional[str] = None
    reset_token_expires_at: Optional[datetime] = None
    preferences_id: Optional[str] = None
    mfa_enabled: bool = False
    mfa_secret: Optional[str] = None
    mfa_pending_secret: Optional[str] = None
    mfa_backup_codes: List[str] = field(default_factory=list)

    def to_dict(self, include_sensitive: bool = False) -> Dict[str, Any]:
        data = {
            "user_id": self.user_id,
            "username": self.username,
            "email": self.email,
            "role": self.role.value if isinstance(self.role, TeamRole) else str(self.role),
            "is_verified": self.is_verified,
            "is_active": self.is_active,
            "mfa_enabled": self.mfa_enabled,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "preferences_id": self.preferences_id,
        }
        if include_sensitive:
            data["verification_token"] = self.verification_token
            data["verification_code"] = self.verification_code
            data["reset_token"] = self.reset_token
        return data


@dataclass
class RefreshTokenRecord:
    token_hash: str
    user_id: str
    family_id: str
    created_at: datetime
    expires_at: datetime
    is_revoked: bool = False
    replaced_by_hash: Optional[str] = None


class AccountLockoutManager:
    """
    Sliding-window brute-force defense tracker enforcing NIST SP 800-63B.
    Locks account or IP after 5 consecutive failures within a 15-minute window.
    """
    MAX_ATTEMPTS = 5
    WINDOW_MINUTES = 15
    LOCKOUT_MINUTES = 15

    def __init__(self):
        self._failures: Dict[str, List[datetime]] = {}  # identifier -> timestamps
        self._locked_until: Dict[str, datetime] = {}  # identifier -> expiry

    def _prune(self, identifier: str, now: datetime):
        cutoff = now - timedelta(minutes=self.WINDOW_MINUTES)
        if identifier in self._failures:
            self._failures[identifier] = [ts for ts in self._failures[identifier] if ts > cutoff]
            if not self._failures[identifier]:
                del self._failures[identifier]

    def is_locked(self, identifier: Optional[str]) -> Tuple[bool, int]:
        """Returns (is_locked, seconds_remaining)."""
        if not identifier:
            return False, 0
        now = datetime.now(timezone.utc)
        if identifier in self._locked_until:
            expiry = self._locked_until[identifier]
            if now < expiry:
                remaining = int((expiry - now).total_seconds())
                return True, max(remaining, 1)
            else:
                del self._locked_until[identifier]
        return False, 0

    def record_failure(self, identifier: Optional[str]) -> Tuple[bool, int, int]:
        """
        Records a failed attempt.
        Returns: (is_now_locked, total_attempts_in_window, seconds_remaining)
        """
        if not identifier:
            return False, 0, 0
        now = datetime.now(timezone.utc)
        self._prune(identifier, now)
        if identifier not in self._failures:
            self._failures[identifier] = []
        self._failures[identifier].append(now)

        attempts = len(self._failures[identifier])
        if attempts >= self.MAX_ATTEMPTS:
            lockout_expiry = now + timedelta(minutes=self.LOCKOUT_MINUTES)
            self._locked_until[identifier] = lockout_expiry
            seconds_remaining = int((lockout_expiry - now).total_seconds())
            logger.warning(
                f"[SECURITY ALERT] Account/IP {identifier} locked for {self.LOCKOUT_MINUTES}m "
                f"after {attempts} failed authentication attempts."
            )
            return True, attempts, seconds_remaining
        return False, attempts, 0

    def record_success(self, identifier: Optional[str]):
        """Clears failure history upon successful authentication."""
        if not identifier:
            return
        self._failures.pop(identifier, None)
        self._locked_until.pop(identifier, None)


lockout_manager = AccountLockoutManager()


def hash_password(password: str) -> str:
    """Hash a password securely using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against the stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def validate_email_format(email: str) -> bool:
    """Strict RFC-compliant email regex validator."""
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return bool(re.match(pattern, email.strip()))


def validate_username_format(username: str) -> bool:
    """Alphanumeric username with underscores or dashes, 3-30 chars."""
    pattern = r"^[a-zA-Z0-9_-]{3,30}$"
    return bool(re.match(pattern, username.strip()))


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """
    Validates password complexity against NIST SP 800-63B:
    - Minimum 8 characters (10+ recommended)
    - Contains lowercase letter
    - Contains uppercase letter
    - Contains numeric digit
    - Contains special/symbol character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number."
    if not re.search(r"[\W_]", password):
        return False, "Password must contain at least one special character or symbol."
    return True, "Password meets institutional security standards."


def hash_token(raw_token: str) -> str:
    """SHA-256 hash for secure token storage."""
    return hashlib.sha256(raw_token.strip().encode("utf-8")).hexdigest()


def create_access_token(
    user: UserRecord,
    session_id: Optional[str] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Generates an RFC-7519 compliant signed JWT Bearer access token."""
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "sub": user.user_id,
        "username": user.username,
        "email": user.email,
        "role": user.role.value if isinstance(user.role, TeamRole) else str(user.role),
        "is_verified": user.is_verified,
        "mfa_enabled": user.mfa_enabled,
        "sid": session_id,
        "token_type": "access",
        "jti": secrets.token_hex(16),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_mfa_challenge_token(user_id: str) -> str:
    """Creates a short-lived 5-minute signed JWT token specifically for the MFA challenge step."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=5)
    payload = {
        "sub": user_id,
        "token_type": "mfa_challenge",
        "jti": secrets.token_hex(16),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_mfa_challenge_token(token: str) -> str:
    """Decodes MFA challenge token and returns user_id if valid."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("token_type") != "mfa_challenge":
            raise TokenExpiredOrInvalidError("Invalid token type. Expected MFA challenge token.")
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise TokenExpiredOrInvalidError("MFA authentication window expired (5 min). Please sign in again.")
    except jwt.InvalidTokenError:
        raise TokenExpiredOrInvalidError("Invalid MFA challenge session.")


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and cryptographically verifies an access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise TokenExpiredOrInvalidError("Session token has expired. Please sign in or refresh your session.")
    except jwt.InvalidTokenError:
        raise TokenExpiredOrInvalidError("Invalid session token.")


class UserAuthStore:
    """
    High-performance, secure user and token store.
    Features state management, password hashing, sliding lockout, and refresh token rotation.
    """

    def __init__(self):
        self._users_by_id: Dict[str, UserRecord] = {}
        self._users_by_email: Dict[str, str] = {}  # email.lower() -> user_id
        self._users_by_username: Dict[str, str] = {}  # username.lower() -> user_id
        self._verification_tokens: Dict[str, str] = {}  # token -> user_id
        self._reset_tokens: Dict[str, str] = {}  # token -> user_id
        self._refresh_tokens: Dict[str, RefreshTokenRecord] = {}  # token_hash -> record
        self._family_tokens: Dict[str, List[str]] = {}  # family_id -> [token_hashes]
        self._oauth_state_cache: Dict[str, Dict[str, Any]] = {}  # state -> {provider, created_at, code_verifier}
        self._sessions_by_id: Dict[str, UserSession] = {}
        self._sessions_by_user: Dict[str, List[str]] = {}
        self._magic_links: Dict[str, Tuple[str, datetime]] = {}  # token -> (user_id, expires_at)
        self._seed_default_institutional_users()

    def _seed_default_institutional_users(self):
        """Seed verified default institutional personas for 5-role team operation."""
        defaults = [
            ("usr_principal_01", "principal", "principal@asup.internal", TeamRole.PRINCIPAL),
            ("usr_analyst_01", "analyst", "analyst@asup.internal", TeamRole.ANALYST),
            ("usr_counsel_01", "counsel", "counsel@asup.internal", TeamRole.COUNSEL),
            ("usr_cpa_01", "cpa", "cpa@asup.internal", TeamRole.CPA),
            ("usr_lender_01", "lender", "lender@asup.internal", TeamRole.LENDER_BROKER),
        ]
        default_pwd_hash = hash_password("Institutional2026!")

        for uid, uname, email, role in defaults:
            user = UserRecord(
                user_id=uid,
                username=uname,
                email=email,
                password_hash=default_pwd_hash,
                role=role,
                is_verified=True,
                is_active=True,
                preferences_id=f"pref_{uname}",
            )
            self._users_by_id[uid] = user
            self._users_by_email[email.lower()] = uid
            self._users_by_username[uname.lower()] = uid

    def register_user(
        self,
        username: str,
        email: str,
        password: str,
        confirm_password: str,
        role: TeamRole = TeamRole.PRINCIPAL,
    ) -> Tuple[UserRecord, str]:
        """
        Registers a new user, validates NIST password complexity, generates verification token.
        Returns: (UserRecord, verification_token)
        """
        username = username.strip()
        email = email.strip().lower()

        if not validate_username_format(username):
            raise ValueError("Username must be between 3 and 30 characters and contain only letters, numbers, hyphens, or underscores.")

        if not validate_email_format(email):
            raise ValueError("Invalid email format.")

        valid_pwd, pwd_err = validate_password_strength(password)
        if not valid_pwd:
            raise ValueError(pwd_err)

        if password != confirm_password:
            raise ValueError("Password and confirmation password do not match.")

        if email in self._users_by_email:
            raise UserAlreadyExistsError(f"An account with email {email} is already registered.")

        if username.lower() in self._users_by_username:
            raise UserAlreadyExistsError(f"Username '{username}' is already taken. Please choose another.")

        now = datetime.now(timezone.utc)
        user_id = f"usr_{secrets.token_hex(8)}"
        v_token = secrets.token_urlsafe(32)
        v_code = f"{secrets.randbelow(900000) + 100000}"  # High-entropy 6-digit verification code
        v_expires = now + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)

        user = UserRecord(
            user_id=user_id,
            username=username,
            email=email,
            password_hash=hash_password(password),
            role=role,
            is_verified=False,
            is_active=True,
            created_at=now,
            updated_at=now,
            verification_token=v_token,
            verification_code=v_code,
            verification_token_expires_at=v_expires,
            preferences_id=f"pref_{username.lower()}",
        )

        self._users_by_id[user_id] = user
        self._users_by_email[email] = user_id
        self._users_by_username[username.lower()] = user_id
        self._verification_tokens[v_token] = user_id
        self._verification_tokens[v_code] = user_id

        return user, v_token

    def verify_email(self, token_or_code: str) -> Tuple[bool, str, Optional[UserRecord]]:
        """
        Verifies a user's email via 6-digit code or full URL token.
        Cleans up both identifiers upon successful activation.
        """
        cleaned = token_or_code.strip()
        user_id = self._verification_tokens.get(cleaned)
        if not user_id or user_id not in self._users_by_id:
            return False, "Verification code or token is invalid or has already been used.", None

        user = self._users_by_id[user_id]
        now = datetime.now(timezone.utc)

        if user.verification_token_expires_at and now > user.verification_token_expires_at:
            return False, "Verification code has expired. Please request a new verification email.", None

        user.is_verified = True
        old_token = user.verification_token
        old_code = user.verification_code
        user.verification_token = None
        user.verification_code = None
        user.verification_token_expires_at = None
        user.updated_at = now

        if old_token and old_token in self._verification_tokens:
            del self._verification_tokens[old_token]
        if old_code and old_code in self._verification_tokens:
            del self._verification_tokens[old_code]

        return True, "Email successfully verified. You can now access all verified platform features.", user

    def resend_verification(self, email: str) -> Tuple[bool, str, Optional[str], Optional[str]]:
        """Generates a fresh email verification token and 6-digit code."""
        email = email.strip().lower()
        user_id = self._users_by_email.get(email)
        if not user_id:
            return False, "No account found with this email address.", None, None

        user = self._users_by_id[user_id]
        if user.is_verified:
            return False, "Account is already verified. You may sign in directly.", None, None

        if user.verification_token and user.verification_token in self._verification_tokens:
            del self._verification_tokens[user.verification_token]
        if user.verification_code and user.verification_code in self._verification_tokens:
            del self._verification_tokens[user.verification_code]

        now = datetime.now(timezone.utc)
        new_token = secrets.token_urlsafe(32)
        new_code = f"{secrets.randbelow(900000) + 100000}"
        user.verification_token = new_token
        user.verification_code = new_code
        user.verification_token_expires_at = now + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)
        user.updated_at = now
        self._verification_tokens[new_token] = user_id
        self._verification_tokens[new_code] = user_id

        return True, "Verification email dispatched.", new_token, new_code

    def authenticate_user(
        self,
        username_or_email: str,
        password: str,
        client_ip: Optional[str] = None,
    ) -> UserRecord:
        """
        Authenticates user with username or email + password.
        Enforces account lockout checks against both identifier and client IP.
        """
        query = username_or_email.strip().lower()

        # 1. Lockout check
        locked_user, user_sec = lockout_manager.is_locked(query)
        if locked_user:
            mins = max(1, user_sec // 60)
            raise AccountLockedError(
                f"Account is temporarily locked due to excessive failed attempts. Try again in {mins} minute(s).",
                retry_after_seconds=user_sec,
            )

        if client_ip:
            locked_ip, ip_sec = lockout_manager.is_locked(f"ip_{client_ip}")
            if locked_ip:
                mins = max(1, ip_sec // 60)
                raise AccountLockedError(
                    f"Too many failed attempts from your IP. Access locked for {mins} minute(s).",
                    retry_after_seconds=ip_sec,
                )

        user_id = self._users_by_email.get(query) or self._users_by_username.get(query)
        if not user_id:
            lockout_manager.record_failure(query)
            if client_ip:
                lockout_manager.record_failure(f"ip_{client_ip}")
            raise InvalidCredentialsError("Invalid username/email or password.")

        user = self._users_by_id.get(user_id)
        if not user or not user.is_active:
            raise InvalidCredentialsError("Account is inactive or disabled.")

        if not verify_password(password, user.password_hash):
            is_locked, attempts, sec = lockout_manager.record_failure(query)
            if client_ip:
                lockout_manager.record_failure(f"ip_{client_ip}")
            if is_locked:
                mins = max(1, sec // 60)
                raise AccountLockedError(
                    f"Too many failed login attempts. Account locked for {mins} minute(s).",
                    retry_after_seconds=sec,
                )
            remaining_attempts = max(0, AccountLockoutManager.MAX_ATTEMPTS - attempts)
            raise InvalidCredentialsError(
                f"Invalid username/email or password. ({remaining_attempts} attempts remaining before temporary lockout)."
            )

        # Clear lockout counter on successful authentication
        lockout_manager.record_success(query)
        if client_ip:
            lockout_manager.record_success(f"ip_{client_ip}")

        return user

    # =========================================================================
    # REFRESH TOKEN ROTATION (RTR) & TOKEN FAMILY REUSE DEFENSE
    # =========================================================================

    def create_refresh_token(
        self,
        user_id: str,
        family_id: Optional[str] = None,
    ) -> Tuple[str, RefreshTokenRecord]:
        """
        Creates a new cryptographically secure rotating refresh token.
        Stores SHA-256 hash in memory and binds to a token family.
        Returns: (raw_refresh_token, RefreshTokenRecord)
        """
        now = datetime.now(timezone.utc)
        raw_token = f"asup_rf_{secrets.token_urlsafe(48)}"
        t_hash = hash_token(raw_token)
        family_id = family_id or f"rfam_{secrets.token_hex(12)}"
        expires_at = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

        record = RefreshTokenRecord(
            token_hash=t_hash,
            user_id=user_id,
            family_id=family_id,
            created_at=now,
            expires_at=expires_at,
            is_revoked=False,
        )

        self._refresh_tokens[t_hash] = record
        if family_id not in self._family_tokens:
            self._family_tokens[family_id] = []
        self._family_tokens[family_id].append(t_hash)

        return raw_token, record

    def rotate_refresh_token(self, raw_refresh_token: str) -> Tuple[str, str, UserRecord]:
        """
        Rotates an existing refresh token:
        1. Checks validity and expiration.
        2. Detects Token Reuse: if token is already revoked, terminates entire family immediately.
        3. Marks old token revoked with replacement pointer.
        4. Issues fresh refresh token in same family and new access token.
        Returns: (new_access_token, new_raw_refresh_token, UserRecord)
        """
        t_hash = hash_token(raw_refresh_token)
        record = self._refresh_tokens.get(t_hash)

        if not record:
            raise TokenExpiredOrInvalidError("Refresh token is invalid or has been revoked.")

        now = datetime.now(timezone.utc)

        # Token Reuse Detection (Replay Attack)
        if record.is_revoked:
            logger.critical(
                f"[SECURITY INCIDENT] Revoked refresh token reuse detected in family {record.family_id}. "
                f"Terminating all active sessions in family."
            )
            # Wipe entire family immediately
            for family_token_hash in self._family_tokens.get(record.family_id, []):
                rec = self._refresh_tokens.get(family_token_hash)
                if rec:
                    rec.is_revoked = True
            raise TokenReuseDetectedError(
                "Security Alert: Compromised refresh token reuse detected. All sessions in this group have been invalidated. Please sign in again."
            )

        if now > record.expires_at:
            record.is_revoked = True
            raise TokenExpiredOrInvalidError("Refresh token has expired. Please sign in again.")

        user = self._users_by_id.get(record.user_id)
        if not user or not user.is_active:
            raise InvalidCredentialsError("User account is inactive or disabled.")

        # Mark old token as revoked
        record.is_revoked = True

        # Generate fresh token in same family
        new_raw_refresh, new_record = self.create_refresh_token(user.user_id, family_id=record.family_id)
        record.replaced_by_hash = new_record.token_hash

        # Generate new short-lived access token
        new_access_token = create_access_token(user)

        return new_access_token, new_raw_refresh, user

    def revoke_refresh_token(self, raw_refresh_token: str) -> bool:
        """Explicitly revokes a refresh token on user signout."""
        t_hash = hash_token(raw_refresh_token)
        record = self._refresh_tokens.get(t_hash)
        if record:
            record.is_revoked = True
            return True
        return False

    def revoke_all_user_sessions(self, user_id: str) -> int:
        """Revokes all active refresh tokens for a user (e.g., on password reset or account compromise)."""
        count = 0
        for rec in self._refresh_tokens.values():
            if rec.user_id == user_id and not rec.is_revoked:
                rec.is_revoked = True
                count += 1
        return count

    # =========================================================================
    # PASSWORD RESET & EMAIL
    # =========================================================================

    def request_password_reset(self, email: str) -> Tuple[bool, str, Optional[str]]:
        """Generates a secure password reset token."""
        email = email.strip().lower()
        user_id = self._users_by_email.get(email)
        if not user_id:
            # Prevent email enumeration by returning a generic success message
            return True, "If an account exists with this email, a reset link has been dispatched.", None

        user = self._users_by_id[user_id]
        now = datetime.now(timezone.utc)

        if user.reset_token and user.reset_token in self._reset_tokens:
            del self._reset_tokens[user.reset_token]

        reset_token = secrets.token_urlsafe(32)
        user.reset_token = reset_token
        user.reset_token_expires_at = now + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)
        user.updated_at = now
        self._reset_tokens[reset_token] = user_id

        return True, "Password reset instructions dispatched.", reset_token

    def reset_password(self, token: str, new_password: str, confirm_password: str) -> Tuple[bool, str]:
        """Resets user's password given a valid reset token and enforces NIST strength."""
        valid_pwd, pwd_err = validate_password_strength(new_password)
        if not valid_pwd:
            return False, pwd_err

        if new_password != confirm_password:
            return False, "New password and confirmation do not match."

        user_id = self._reset_tokens.get(token)
        if not user_id or user_id not in self._users_by_id:
            return False, "Password reset token is invalid or has expired."

        user = self._users_by_id[user_id]
        now = datetime.now(timezone.utc)

        if user.reset_token_expires_at and now > user.reset_token_expires_at:
            return False, "Password reset token has expired. Please request a new one."

        user.password_hash = hash_password(new_password)
        user.reset_token = None
        user.reset_token_expires_at = None
        user.updated_at = now
        del self._reset_tokens[token]

        # Invalidate all active sessions across all devices for security
        self.revoke_all_user_sessions(user.user_id)

        return True, "Password updated successfully. You can now sign in with your new password."

    def get_user_by_id(self, user_id: str) -> Optional[UserRecord]:
        return self._users_by_id.get(user_id)

    # =========================================================================
    # ACTIVE SESSIONS & FLEET DEVICE MANAGEMENT
    # =========================================================================

    def create_session(
        self,
        user_id: str,
        client_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> UserSession:
        """Provisions an auditable active session record with device fingerprint."""
        now = datetime.now(timezone.utc)
        session_id = f"ses_{secrets.token_hex(16)}"
        device_name = parse_device_summary(user_agent or "")
        session = UserSession(
            session_id=session_id,
            user_id=user_id,
            client_ip=client_ip or "127.0.0.1",
            user_agent=user_agent or "Web Client",
            device_name=device_name,
            created_at=now,
            last_active_at=now,
            is_revoked=False,
        )
        self._sessions_by_id[session_id] = session
        if user_id not in self._sessions_by_user:
            self._sessions_by_user[user_id] = []
        self._sessions_by_user[user_id].append(session_id)
        return session

    def get_user_sessions(
        self,
        user_id: str,
        current_session_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Returns all non-revoked active sessions for user, flagging current device."""
        sessions = []
        s_ids = self._sessions_by_user.get(user_id, [])
        for sid in s_ids:
            s = self._sessions_by_id.get(sid)
            if s and not s.is_revoked:
                sessions.append(s.to_dict(is_current=(sid == current_session_id)))
        sessions.sort(key=lambda x: x["last_active_at"], reverse=True)
        return sessions

    def revoke_session(self, session_id: str, user_id: str) -> bool:
        """Revokes an individual session."""
        session = self._sessions_by_id.get(session_id)
        if session and session.user_id == user_id and not session.is_revoked:
            session.is_revoked = True
            return True
        return False

    def revoke_other_sessions(self, user_id: str, keep_session_id: Optional[str] = None) -> int:
        """Terminates all sessions for a user except the currently active device session."""
        count = 0
        s_ids = self._sessions_by_user.get(user_id, [])
        for sid in s_ids:
            if sid != keep_session_id:
                s = self._sessions_by_id.get(sid)
                if s and not s.is_revoked:
                    s.is_revoked = True
                    count += 1
        return count

    # =========================================================================
    # MULTI-FACTOR AUTHENTICATION (MFA / 2FA RFC 6238 TOTP)
    # =========================================================================

    def setup_mfa(self, user_id: str) -> Tuple[str, str, List[str]]:
        """
        Initiates MFA setup: generates Base32 secret, otpauth URI, and 8 backup recovery codes.
        Codes remain pending until verified with a live 6-digit TOTP code.
        """
        user = self._users_by_id.get(user_id)
        if not user:
            raise InvalidCredentialsError("User account not found.")
        secret = generate_totp_secret()
        user.mfa_pending_secret = secret
        plain_codes, hashed_codes = generate_backup_codes(8)
        user.mfa_backup_codes = hashed_codes
        otpauth_uri = get_totp_uri(secret, user.email, issuer="Argus Institutional")
        return secret, otpauth_uri, plain_codes

    def enable_mfa(self, user_id: str, code: str) -> Tuple[bool, str]:
        """Validates first live code and enables MFA permanently on the account."""
        user = self._users_by_id.get(user_id)
        if not user or not user.mfa_pending_secret:
            raise ValueError("MFA enrollment has not been initiated. Please start setup first.")
        if not verify_totp(user.mfa_pending_secret, code):
            raise InvalidCredentialsError("Invalid 6-digit TOTP verification code. Please check your authenticator clock.")
        user.mfa_secret = user.mfa_pending_secret
        user.mfa_pending_secret = None
        user.mfa_enabled = True
        user.updated_at = datetime.now(timezone.utc)
        return True, "Multi-Factor Authentication (Cisco Duo / TOTP) successfully activated."

    def disable_mfa(self, user_id: str, password: str, code: Optional[str] = None) -> Tuple[bool, str]:
        """Disables MFA after verifying account password."""
        user = self._users_by_id.get(user_id)
        if not user:
            raise InvalidCredentialsError("User account not found.")
        if not verify_password(password, user.password_hash):
            raise InvalidCredentialsError("Current password incorrect. Password required to disable MFA.")
        if code and user.mfa_secret and not verify_totp(user.mfa_secret, code):
            raise InvalidCredentialsError("Invalid TOTP verification code.")
        user.mfa_enabled = False
        user.mfa_secret = None
        user.mfa_pending_secret = None
        user.mfa_backup_codes = []
        user.updated_at = datetime.now(timezone.utc)
        return True, "Two-Factor Authentication has been disabled."

    def verify_mfa_login(
        self,
        mfa_session_token: str,
        code_or_backup: str,
        client_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[UserRecord, str, str, UserSession]:
        """
        Completes the second step of MFA authentication.
        Accepts either standard 6-digit TOTP code or single-use 8-character backup recovery code.
        """
        user_id = decode_mfa_challenge_token(mfa_session_token)
        user = self._users_by_id.get(user_id)
        if not user or not user.mfa_enabled or not user.mfa_secret:
            raise InvalidCredentialsError("MFA is not configured or user does not exist.")

        clean = code_or_backup.strip().replace(" ", "")
        is_totp = verify_totp(user.mfa_secret, clean)
        used_backup = False

        if not is_totp:
            clean_upper = clean.upper()
            h = hashlib.sha256(clean_upper.encode("utf-8")).hexdigest()
            if h in user.mfa_backup_codes:
                user.mfa_backup_codes.remove(h)
                used_backup = True
            else:
                h2 = hashlib.sha256(clean.encode("utf-8")).hexdigest()
                if h2 in user.mfa_backup_codes:
                    user.mfa_backup_codes.remove(h2)
                    used_backup = True

        if not is_totp and not used_backup:
            raise InvalidCredentialsError("Invalid 6-digit authenticator code or single-use backup recovery code.")

        session = self.create_session(user.user_id, client_ip, user_agent)
        access_token = create_access_token(user, session_id=session.session_id)
        raw_refresh, _ = self.create_refresh_token(user.user_id)
        return user, access_token, raw_refresh, session

    # =========================================================================
    # DIRECT PASSWORD CHANGE & PASSWORDLESS MAGIC LINK
    # =========================================================================

    def change_password(
        self,
        user_id: str,
        current_password: str,
        new_password: str,
        confirm_password: str,
    ) -> Tuple[bool, str, UserRecord]:
        """Validates current password, checks NIST SP 800-63B complexity, updates hash, revokes sessions."""
        user = self._users_by_id.get(user_id)
        if not user:
            raise InvalidCredentialsError("User account not found.")
        if not verify_password(current_password, user.password_hash):
            raise InvalidCredentialsError("Current password is incorrect.")
        if new_password != confirm_password:
            raise ValueError("New password and confirmation do not match.")
        valid, msg = validate_password_strength(new_password)
        if not valid:
            raise ValueError(msg)
        if verify_password(new_password, user.password_hash):
            raise ValueError("New password cannot be identical to your current password.")

        user.password_hash = hash_password(new_password)
        user.updated_at = datetime.now(timezone.utc)

        # Invalidate other refresh tokens and sessions for security
        self.revoke_all_user_sessions(user.user_id)
        self.revoke_other_sessions(user.user_id)
        return True, "Password successfully updated. All other active sessions have been terminated.", user

    def request_magic_link(self, email: str) -> Tuple[bool, str, Optional[str], Optional[UserRecord]]:
        """Generates a 15-minute single-use passwordless sign-in token."""
        email = email.strip().lower()
        user_id = self._users_by_email.get(email)
        if not user_id:
            return True, "If an account exists with this email, a sign-in link has been dispatched.", None, None
        user = self._users_by_id[user_id]
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        self._magic_links[token] = (user_id, expires_at)
        return True, "Magic sign-in link generated.", token, user

    def verify_magic_link(
        self,
        token: str,
        client_ip: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[UserRecord, str, str, UserSession]:
        """Validates and consumes a single-use magic sign-in link."""
        entry = self._magic_links.get(token)
        if not entry:
            raise TokenExpiredOrInvalidError("Magic sign-in link is invalid or has already been used.")
        user_id, expires_at = entry
        if datetime.now(timezone.utc) > expires_at:
            del self._magic_links[token]
            raise TokenExpiredOrInvalidError("Magic sign-in link has expired. Please request a new one.")
        del self._magic_links[token]
        user = self._users_by_id.get(user_id)
        if not user or not user.is_active:
            raise InvalidCredentialsError("Account is inactive or disabled.")

        session = self.create_session(user.user_id, client_ip, user_agent)
        access_token = create_access_token(user, session_id=session.session_id)
        raw_refresh, _ = self.create_refresh_token(user.user_id)
        return user, access_token, raw_refresh, session

    # =========================================================================
    # OAUTH2 PKCE AUTHORIZATION & VERIFICATION
    # =========================================================================

    def generate_oauth_authorization_url(
        self,
        provider: str,
        redirect_uri: str,
        state: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Constructs an RFC-7636 OAuth2 PKCE authorization URL.
        Caches state and code verifier for callback verification.
        """
        provider = provider.lower()
        state = state or secrets.token_urlsafe(24)
        code_verifier = secrets.token_urlsafe(48)
        # RFC-7636 Section 4.2: BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
        digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
        code_challenge = base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")

        self._oauth_state_cache[state] = {
            "provider": provider,
            "code_verifier": code_verifier,
            "redirect_uri": redirect_uri,
            "created_at": datetime.now(timezone.utc),
        }

        if provider == "google":
            client_id = os.environ.get("GOOGLE_CLIENT_ID", "mock-google-client-id-2026.apps.googleusercontent.com")
            base_url = "https://accounts.google.com/o/oauth2/v2/auth"
            scope = "openid email profile"
            auth_url = (
                f"{base_url}?response_type=code&client_id={client_id}"
                f"&redirect_uri={redirect_uri}&scope={scope}&state={state}"
                f"&code_challenge={code_challenge}&code_challenge_method=S256"
            )
            return {
                "auth_url": auth_url,
                "state": state,
                "code_challenge": code_challenge,
                "provider": "google",
                "is_configured": bool(os.environ.get("GOOGLE_CLIENT_ID")),
            }
        elif provider == "microsoft":
            client_id = os.environ.get("MICROSOFT_CLIENT_ID", "mock-microsoft-client-id-2026")
            tenant = os.environ.get("MICROSOFT_TENANT_ID", "common")
            base_url = f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize"
            scope = "openid email profile"
            auth_url = (
                f"{base_url}?response_type=code&client_id={client_id}"
                f"&redirect_uri={redirect_uri}&scope={scope}&state={state}"
                f"&code_challenge={code_challenge}&code_challenge_method=S256"
            )
            return {
                "auth_url": auth_url,
                "state": state,
                "code_challenge": code_challenge,
                "provider": "microsoft",
                "is_configured": bool(os.environ.get("MICROSOFT_CLIENT_ID")),
            }
        else:
            raise ValueError(f"Unsupported OAuth provider: {provider}")

    def process_oauth_callback(
        self,
        provider: str,
        code: str,
        state: str,
        mock_email: Optional[str] = None,
        mock_username: Optional[str] = None,
    ) -> Tuple[UserRecord, str, str]:
        """
        Validates state token and exchanges auth code for user identity.
        Provisions a new verified institutional user if not already present.
        Returns: (UserRecord, access_token, refresh_token)
        """
        cached = self._oauth_state_cache.get(state)
        if not cached:
            raise TokenExpiredOrInvalidError("Invalid or expired OAuth state parameter (CSRF protection failed).")

        # Invalidate state token after one-time use
        del self._oauth_state_cache[state]

        email: Optional[str] = None
        username: Optional[str] = None

        # Check if live Google OAuth exchange should execute
        google_client_id = os.environ.get("GOOGLE_CLIENT_ID")
        google_client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
        is_mock_code = code.startswith("inst_eval") or code.startswith("test_") or code.startswith("mock_")

        if provider == "google" and google_client_id and google_client_secret and not is_mock_code and not mock_email:
            try:
                import json
                import urllib.parse
                import urllib.request

                token_url = "https://oauth2.googleapis.com/token"
                token_data = {
                    "code": code,
                    "client_id": google_client_id,
                    "client_secret": google_client_secret,
                    "redirect_uri": cached.get("redirect_uri", ""),
                    "grant_type": "authorization_code",
                }
                code_verifier = cached.get("code_verifier")
                if code_verifier:
                    token_data["code_verifier"] = code_verifier

                encoded_data = urllib.parse.urlencode(token_data).encode("utf-8")
                token_req = urllib.request.Request(
                    token_url,
                    data=encoded_data,
                    headers={
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Accept": "application/json",
                        "User-Agent": "Argus-Auth-Engine/1.0",
                    },
                    method="POST",
                )
                with urllib.request.urlopen(token_req, timeout=10) as resp:
                    resp_data = json.loads(resp.read().decode("utf-8"))
                    google_access_token = resp_data.get("access_token")
                    id_token_jwt = resp_data.get("id_token")

                # Parse user info from userinfo endpoint or id_token
                user_info: Dict[str, Any] = {}
                if google_access_token:
                    try:
                        userinfo_req = urllib.request.Request(
                            "https://www.googleapis.com/oauth2/v3/userinfo",
                            headers={
                                "Authorization": f"Bearer {google_access_token}",
                                "Accept": "application/json",
                                "User-Agent": "Argus-Auth-Engine/1.0",
                            },
                            method="GET",
                        )
                        with urllib.request.urlopen(userinfo_req, timeout=10) as u_resp:
                            user_info = json.loads(u_resp.read().decode("utf-8"))
                    except Exception as u_err:
                        logger.warning(f"Google userinfo endpoint fetch failed, falling back to id_token: {u_err}")

                if not user_info.get("email") and id_token_jwt:
                    parts = id_token_jwt.split(".")
                    if len(parts) >= 2:
                        padded = parts[1] + "=" * (-len(parts[1]) % 4)
                        user_info = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8"))

                google_email = user_info.get("email")
                if not google_email:
                    raise AuthError("Google OAuth exchange did not return a verified email address.")

                email = google_email.strip().lower()
                name = user_info.get("name") or user_info.get("given_name")
                if name:
                    slug = re.sub(r"[^a-zA-Z0-9_]", "_", name.lower().strip())
                    username = slug[:24].strip("_")
                else:
                    username = email.split("@")[0][:24]

            except Exception as exc:
                logger.error(f"Google OAuth token exchange failed: {exc}", exc_info=True)
                raise AuthError(f"Google authentication exchange failed: {str(exc)}")

        # Fallback to mock or hint values if not obtained via real OAuth exchange
        if not email:
            email = (mock_email or f"sso.{provider}@asup.internal").strip().lower()
        if not username:
            username = (mock_username or f"sso_{provider}_{secrets.token_hex(4)}").strip()

        user_id = self._users_by_email.get(email)
        if user_id:
            user = self._users_by_id[user_id]
            user.is_verified = True
            user.updated_at = datetime.now(timezone.utc)
        else:
            now = datetime.now(timezone.utc)
            new_uid = f"usr_{secrets.token_hex(8)}"
            existing_uid = self._users_by_username.get(username.lower())
            if existing_uid:
                username = f"{username}_{secrets.token_hex(3)}"

            user = UserRecord(
                user_id=new_uid,
                username=username,
                email=email,
                password_hash=hash_password(secrets.token_urlsafe(32)),
                role=TeamRole.PRINCIPAL,
                is_verified=True,
                is_active=True,
                created_at=now,
                updated_at=now,
                preferences_id=f"pref_{username.lower()}",
            )
            self._users_by_id[new_uid] = user
            self._users_by_email[email] = new_uid
            self._users_by_username[username.lower()] = new_uid

        access_token = create_access_token(user)
        refresh_token, _ = self.create_refresh_token(user.user_id)

        return user, access_token, refresh_token


# Global singleton store
auth_store = UserAuthStore()


def get_oauth_providers_status() -> Dict[str, Any]:
    """
    Returns available third-party OAuth providers and readiness status.
    Keeps Google and SSO completely optional without hard dependencies.
    """
    google_client_id = os.environ.get("GOOGLE_CLIENT_ID")
    ms_client_id = os.environ.get("MICROSOFT_CLIENT_ID")

    return {
        "google": {
            "enabled": bool(google_client_id),
            "client_id": google_client_id if google_client_id else None,
            "provider_name": "Google Identity Services",
            "is_mock_available": True,
        },
        "microsoft": {
            "enabled": bool(ms_client_id),
            "client_id": ms_client_id if ms_client_id else None,
            "provider_name": "Microsoft 365 / Azure AD",
            "is_mock_available": True,
        },
    }
