"""
Enterprise Security Headers and Rate Limiting Middleware.
Provides defense-in-depth protection: HSTS, X-Frame-Options, X-Content-Type-Options,
Referrer-Policy, and sliding-window rate limiting on sensitive authentication routes.
"""

from collections import defaultdict
from datetime import datetime, timedelta, timezone
import json
import logging
import os
from typing import Callable, Dict, List

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger("asup.security.middleware")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Injects enterprise browser security headers across all outgoing HTTP responses.
    Guards against clickjacking, MIME sniffing, and protocol downgrade attacks.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        headers = response.headers

        # 1. HTTP Strict Transport Security (HSTS)
        headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        # 2. Frame Protection (Anti-Clickjacking)
        headers["X-Frame-Options"] = "DENY"

        # 3. MIME Sniffing Prevention
        headers["X-Content-Type-Options"] = "nosniff"

        # 4. Cross-Site Scripting Filter
        headers["X-XSS-Protection"] = "1; mode=block"

        # 5. Referrer Policy
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # 6. Feature / Permissions Policy
        headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        return response


class AuthRateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Sliding-window IP rate limiter specifically guarding `/v1/auth/*` routes.
    Prevents credential stuffing, password spray, and denial-of-service against identity endpoints.
    """

    def __init__(self, app, max_requests_per_minute: int = 30):
        super().__init__(app)
        self.max_requests = max_requests_per_minute
        self.window_seconds = 60
        self._ip_history: Dict[str, List[datetime]] = defaultdict(list)

    def _get_client_ip(self, request: Request) -> str:
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "127.0.0.1"

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path

        # Only apply rate limiting to authentication routes
        if path.startswith("/v1/auth/"):
            client_ip = self._get_client_ip(request)
            now = datetime.now(timezone.utc)
            cutoff = now - timedelta(seconds=self.window_seconds)

            # Prune old timestamps
            self._ip_history[client_ip] = [ts for ts in self._ip_history[client_ip] if ts > cutoff]

            if len(self._ip_history[client_ip]) >= self.max_requests:
                logger.warning(f"[RATE LIMIT] IP {client_ip} exceeded auth rate limit ({self.max_requests} rpm).")
                return JSONResponse(
                    status_code=429,
                    content={
                        "status": "error",
                        "detail": f"Too many authentication requests from this IP. Please wait {self.window_seconds} seconds before retrying.",
                        "retry_after_seconds": self.window_seconds,
                    },
                    headers={"Retry-After": str(self.window_seconds)},
                )

            self._ip_history[client_ip].append(now)

        return await call_next(request)
