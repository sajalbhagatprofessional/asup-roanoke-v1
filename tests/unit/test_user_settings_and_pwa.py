"""
Unit Tests for Argus Persistent User Settings, PWA Auto-Update Models & Cross-Device Sync.
Compliance: Air-gapped serialization, RBAC role claims, default fallback, and schema validation.
"""

from decimal import Decimal

from services.security.user_settings import (
    AutoUpdatePromptMode,
    InterfaceDensity,
    ThemeMode,
    UserSettings,
)


def test_user_settings_default_factory():
    settings = UserSettings.create_default(
        user_id="usr_test_principal",
        role="PRINCIPAL",
        email="principal_test@asup.internal",
    )
    assert settings.user_id == "usr_test_principal"
    assert settings.role == "PRINCIPAL"
    assert settings.email == "principal_test@asup.internal"
    assert settings.theme == ThemeMode.DARK
    assert settings.density == InterfaceDensity.COMFORTABLE
    assert settings.auto_update_enabled is True
    assert settings.auto_update_prompt_mode == AutoUpdatePromptMode.NOTIFY_BEFORE_RELOAD
    assert settings.push_notifications_enabled is True
    assert settings.foreclosure_statutory_alerts is True
    assert settings.monday_weekly_digest_push is True
    assert Decimal(settings.default_replacement_gm_salary_usd) == Decimal("85000.00")
    assert Decimal(settings.default_target_cap_rate_pct) == Decimal("0.0725")


def test_user_settings_custom_serialization():
    settings = UserSettings(
        user_id="usr_analyst_01",
        display_name="Senior Analyst",
        email="analyst@asup.internal",
        role="ANALYST",
        organization="Argus M&A Team",
        theme=ThemeMode.BLOOMBERG_NAVY,
        density=InterfaceDensity.COMPACT,
        high_contrast=True,
        default_landing_view="DIGEST",
        auto_update_enabled=True,
        auto_update_prompt_mode=AutoUpdatePromptMode.SILENT_AUTO_RELOAD,
        default_target_cap_rate_pct="0.0800",
        default_hurdle_base_dscr="1.40",
    )
    d = settings.to_dict()
    assert d["user_id"] == "usr_analyst_01"
    assert d["theme"] == "BLOOMBERG_NAVY"
    assert d["density"] == "COMPACT"
    assert d["high_contrast"] is True
    assert d["auto_update_prompt_mode"] == "SILENT_AUTO_RELOAD"
    assert d["default_target_cap_rate_pct"] == "0.0800"

    # Re-instantiate from dict
    reconstructed = UserSettings(**d)
    assert reconstructed.theme == ThemeMode.BLOOMBERG_NAVY
    assert reconstructed.density == InterfaceDensity.COMPACT
    assert reconstructed.default_hurdle_base_dscr == "1.40"
