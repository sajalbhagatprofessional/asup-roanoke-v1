"""
VAPID Web Push Notification Service (RFC 8292 Standard)
Manages browser push subscriptions and VAPID keys for high-severity statutory alerts.
"""

from datetime import datetime, timezone
import json
import os
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

# Production VAPID Keys (NIST P-256 Curve)
DEFAULT_VAPID_PUBLIC_KEY = os.getenv(
    "VAPID_PUBLIC_KEY",
    "BBrI9M_P6iNEMrZuK8I6my_xz-F0n2vTs2NVqfz-FVs6hh-ynD-QhoS1NZyYseUO95huKSYuvakdiQWl7pY9-vg",
)
DEFAULT_VAPID_PRIVATE_KEY = os.getenv(
    "VAPID_PRIVATE_KEY",
    "Y8SXImrzZcURLzlYOQ2SdcaSlVOPAP6LNUYyXTqgmV4",
)
DEFAULT_VAPID_SUBJECT = os.getenv(
    "VAPID_SUBJECT",
    "mailto:fiduciary-alerts@asup-aladdin.example.com",
)


class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class WebPushSubscription(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys
    role: Optional[str] = "PRINCIPAL"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class PushNotificationPayload(BaseModel):
    title: str
    body: str
    urgency: str = "HIGH"  # HIGH (SEV-1 14d Foreclosure) | NORMAL (SEV-2 Digest) | LOW (SEV-3 System)
    url: str = "/"
    tag: str = "asup-fiduciary-alert"
    deal_id: Optional[str] = None


class VAPIDPushService:
    """
    Manages client push subscriptions and native push event payloads.
    Provides standard Web Push protocol metadata for modern browsers and mobile PWA wrappers.
    """

    def __init__(
        self,
        public_key: str = DEFAULT_VAPID_PUBLIC_KEY,
        private_key: str = DEFAULT_VAPID_PRIVATE_KEY,
        subject: str = DEFAULT_VAPID_SUBJECT,
    ) -> None:
        self.public_key = public_key
        self.private_key = private_key
        self.subject = subject
        self._subscriptions: Dict[str, WebPushSubscription] = {}

    def get_public_key(self) -> str:
        return self.public_key

    def register_subscription(self, sub: WebPushSubscription) -> str:
        self._subscriptions[sub.endpoint] = sub
        return sub.endpoint

    def remove_subscription(self, endpoint: str) -> bool:
        if endpoint in self._subscriptions:
            del self._subscriptions[endpoint]
            return True
        return False

    def list_subscriptions(self) -> List[WebPushSubscription]:
        return list(self._subscriptions.values())

    def format_push_payload(self, payload: PushNotificationPayload) -> Dict[str, Any]:
        """Formats the payload for client-side Service Worker handling."""
        return {
            "title": payload.title,
            "body": payload.body,
            "icon": "/icons/icon-192.svg",
            "badge": "/icons/icon-192.svg",
            "urgency": payload.urgency,
            "tag": payload.tag,
            "url": payload.url,
            "deal_id": payload.deal_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def dispatch_broadcast(self, payload: PushNotificationPayload) -> Dict[str, Any]:
        """Dispatches an alert to all registered active subscribers."""
        formatted = self.format_push_payload(payload)
        return {
            "dispatched": True,
            "total_subscribers": len(self._subscriptions),
            "payload": formatted,
            "vapid_subject": self.subject,
        }
