"""
Developer & Agent API Key Store for Model Context Protocol (MCP) & REST Access.
Provides secure API key generation, cryptographic hashing (SHA-256), permission scoping,
and rate-limiting validation for external AI agents (Claude, Hermes, OpenClaw, Copilot).
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
import hashlib
import json
import logging
import os
import secrets
from typing import Any, Dict, List, Optional

logger = logging.getLogger("asup.security.api_keys")

DEFAULT_KEYS_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "services",
    "persistence",
    "developer_api_keys.json",
)


@dataclass
class ApiKeyRecord:
    key_id: str
    name: str
    key_prefix: str  # First 12 chars: e.g. "asup_live_7a9"
    key_hash: str  # SHA-256 hash of the full raw secret
    role: str  # "ADMIN", "ANALYST", "READ_ONLY"
    created_at: str
    last_used_at: Optional[str] = None
    is_active: bool = True
    rate_limit_rpm: int = 120  # Requests per minute

    def to_dict(self) -> Dict[str, Any]:
        return {
            "key_id": self.key_id,
            "name": self.name,
            "key_prefix": self.key_prefix,
            "role": self.role,
            "created_at": self.created_at,
            "last_used_at": self.last_used_at,
            "is_active": self.is_active,
            "rate_limit_rpm": self.rate_limit_rpm,
        }


class ApiKeyStore:
    """
    Persistent developer API key registry.
    """

    def __init__(self, storage_path: str = DEFAULT_KEYS_FILE):
        self.storage_path = storage_path
        self._keys: Dict[str, ApiKeyRecord] = {}  # key_hash -> record
        self._load_from_disk()
        self._ensure_default_developer_key()

    def _hash_key(self, raw_key: str) -> str:
        return hashlib.sha256(raw_key.strip().encode("utf-8")).hexdigest()

    def _ensure_default_developer_key(self):
        """Ensures at least one pre-configured institutional developer key exists for testing."""
        default_raw = "asup_live_anthropic_mcp_master_key_2026"
        h = self._hash_key(default_raw)
        if h not in self._keys:
            rec = ApiKeyRecord(
                key_id="KEY-DEV-001",
                name="Anthropic Claude / MCP Master Gateway",
                key_prefix=default_raw[:14] + "...",
                key_hash=h,
                role="ADMIN",
                created_at="2026-05-01T00:00:00Z",
                is_active=True,
                rate_limit_rpm=300,
            )
            self._keys[h] = rec
            self._save_to_disk()

    def _load_from_disk(self):
        if not os.path.exists(self.storage_path):
            return
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    rec = ApiKeyRecord(**item)
                    self._keys[rec.key_hash] = rec
        except Exception as e:
            logger.warning(f"Failed to load API keys from {self.storage_path}: {e}")

    def _save_to_disk(self):
        try:
            os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
            with open(self.storage_path, "w", encoding="utf-8") as f:
                records = [
                    {
                        "key_id": r.key_id,
                        "name": r.name,
                        "key_prefix": r.key_prefix,
                        "key_hash": r.key_hash,
                        "role": r.role,
                        "created_at": r.created_at,
                        "last_used_at": r.last_used_at,
                        "is_active": r.is_active,
                        "rate_limit_rpm": r.rate_limit_rpm,
                    }
                    for r in self._keys.values()
                ]
                json.dump(records, f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to save API keys to {self.storage_path}: {e}")

    def create_key(self, name: str, role: str = "ANALYST") -> Dict[str, Any]:
        """
        Generates a secure 32-byte API token with prefix 'asup_live_'.
        Returns the raw secret ONCE to the user.
        """
        raw_token = f"asup_live_{secrets.token_urlsafe(32)}"
        key_id = f"KEY-{secrets.token_hex(4).upper()}"
        h = self._hash_key(raw_token)
        now = datetime.now(timezone.utc).isoformat()

        rec = ApiKeyRecord(
            key_id=key_id,
            name=name,
            key_prefix=raw_token[:14] + "...",
            key_hash=h,
            role=role,
            created_at=now,
            is_active=True,
            rate_limit_rpm=180 if role == "ADMIN" else 100,
        )
        self._keys[h] = rec
        self._save_to_disk()

        return {
            "key_id": key_id,
            "name": name,
            "raw_api_key": raw_token,
            "role": role,
            "created_at": now,
            "message": "Store this API key safely. It will not be shown again in plaintext.",
        }

    def validate_key(self, raw_key: str) -> Optional[ApiKeyRecord]:
        """Validates raw token against SHA-256 hash ledger."""
        if not raw_key:
            return None
        h = self._hash_key(raw_key)
        rec = self._keys.get(h)
        if rec and rec.is_active:
            rec.last_used_at = datetime.now(timezone.utc).isoformat()
            self._save_to_disk()
            return rec
        return None

    def list_keys(self) -> List[Dict[str, Any]]:
        """Returns sanitized metadata for all keys."""
        return [r.to_dict() for r in self._keys.values()]

    def revoke_key(self, key_id: str) -> bool:
        """Deactivates a key by ID."""
        for h, r in self._keys.items():
            if r.key_id == key_id:
                r.is_active = False
                self._save_to_disk()
                return True
        return False


# Global Singleton Instance
api_key_store = ApiKeyStore()
