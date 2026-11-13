"""
Argus (v1.0) — Persistent User Settings & Preferences Model
Provides cross-device persistent state for individual users:
- User Identity & Organization
- Theme & Appearance (Dark, Light, Midnight OLED, Bloomberg Navy)
- Notification Rules (Web Push, Statutory 14-day foreclosure alerts, Monday Digest)
- PWA Auto-Update & Offline Storage policies
- Default Underwriting & Sourcing Parameters (Cap Rate, GM Salary, DSCR)
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ThemeMode(str, Enum):
    DARK = "DARK"
    LIGHT = "LIGHT"
    MIDNIGHT_OLED = "MIDNIGHT_OLED"
    BLOOMBERG_NAVY = "BLOOMBERG_NAVY"


class InterfaceDensity(str, Enum):
    COMFORTABLE = "COMFORTABLE"
    COMPACT = "COMPACT"


class AutoUpdatePromptMode(str, Enum):
    SILENT_AUTO_RELOAD = "SILENT_AUTO_RELOAD"
    NOTIFY_BEFORE_RELOAD = "NOTIFY_BEFORE_RELOAD"


class UserSettings(BaseModel):
    user_id: str = "default_investor"
    display_name: str = "Principal Family Office"
    email: str = "principal@asup.internal"
    phone: Optional[str] = None
    role: str = "PRINCIPAL"
    organization: str = "Argus Intelligence Capital"

    # Theme & Appearance
    theme: ThemeMode = ThemeMode.DARK
    density: InterfaceDensity = InterfaceDensity.COMFORTABLE
    high_contrast: bool = False
    default_landing_view: str = "AGGREGATOR"  # "AGGREGATOR" | "DIGEST"
    default_role: str = "PRINCIPAL"
    currency_format: str = "USD_STANDARD"    # "USD_STANDARD" | "USD_COMPACT"

    # Notifications
    push_notifications_enabled: bool = True
    foreclosure_statutory_alerts: bool = True  # 14-day Va. Code § 55.1-321 statutory alerts
    monday_weekly_digest_push: bool = True    # Monday 07:00 EST <= 5 verified deals
    instant_distress_alerts: bool = True       # Chapter 11 / TACS / Judicial filings
    sound_alerts_enabled: bool = True
    vibration_enabled: bool = True
    quiet_hours_enabled: bool = False
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "07:00"

    # PWA & Auto-Update
    auto_update_enabled: bool = True
    auto_update_prompt_mode: AutoUpdatePromptMode = AutoUpdatePromptMode.NOTIFY_BEFORE_RELOAD
    offline_cache_enabled: bool = True
    background_sync_enabled: bool = True
    update_check_interval_minutes: int = 30

    # Underwriting & Sourcing Defaults
    default_target_cap_rate_pct: str = "0.0725"         # 7.25% corporate cap rate
    default_replacement_gm_salary_usd: str = "85000.00" # Statutory $85k/yr deduction
    default_hurdle_base_dscr: str = "1.35"              # 1.35x base hurdle
    default_hurdle_stressed_dscr: str = "1.15"          # 1.15x stressed hurdle
    default_max_purchase_price_usd: str = "5000000.00"
    default_target_locations: List[str] = Field(
        default_factory=lambda: [
            "City of Roanoke, VA",
            "Roanoke County, VA",
            "Allentown, PA",
        ]
    )

    # Metadata
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    client_device_info: Optional[str] = "Argus PWA Shell"

    def to_dict(self) -> Dict[str, Any]:
        return self.dict()

    @classmethod
    def create_default(cls, user_id: str = "default_investor", role: str = "PRINCIPAL", email: str = "principal@asup.internal") -> "UserSettings":
        return cls(
            user_id=user_id,
            display_name=f"{role.capitalize()} Operator",
            email=email,
            role=role,
        )
