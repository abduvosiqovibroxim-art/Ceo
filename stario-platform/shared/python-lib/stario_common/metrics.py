"""
Prometheus metrics and analytics tracking.
"""

import time
from functools import wraps
from typing import Any, Callable, Optional

from prometheus_client import Counter, Gauge, Histogram, Info

# Service info
service_info = Info("stario_service", "Service information")

# HTTP metrics
http_requests_total = Counter(
    "stario_http_requests_total",
    "Total HTTP requests",
    ["service", "method", "endpoint", "status"],
)

http_request_duration_seconds = Histogram(
    "stario_http_request_duration_seconds",
    "HTTP request duration",
    ["service", "method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

# AI processing metrics
ai_job_duration_seconds = Histogram(
    "stario_ai_job_duration_seconds",
    "AI job processing duration",
    ["service", "job_type", "status"],
    buckets=[1, 5, 10, 20, 30, 40, 60, 120, 300],
)

ai_jobs_total = Counter(
    "stario_ai_jobs_total",
    "Total AI jobs processed",
    ["service", "job_type", "status"],
)

ai_queue_size = Gauge(
    "stario_ai_queue_size",
    "Current AI job queue size",
    ["service", "queue_name"],
)

# Business metrics
orders_total = Counter(
    "stario_orders_total",
    "Total orders created",
    ["product_type", "status"],
)

revenue_total = Counter(
    "stario_revenue_total",
    "Total revenue in cents",
    ["currency", "payment_provider", "product_type"],
)

active_users = Gauge(
    "stario_active_users",
    "Currently active users",
    ["platform"],
)

# Moderation metrics
moderation_checks_total = Counter(
    "stario_moderation_checks_total",
    "Total moderation checks",
    ["content_type", "result"],
)

moderation_latency_seconds = Histogram(
    "stario_moderation_latency_seconds",
    "Moderation check latency",
    ["content_type"],
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0],
)


class MetricsCollector:
    """Centralized metrics collection."""

    def __init__(self, service_name: str):
        self.service_name = service_name
        service_info.info({"service": service_name, "version": "1.0.0"})

    def track_request(
        self,
        method: str,
        endpoint: str,
        status: int,
        duration: float,
    ) -> None:
        """Track an HTTP request."""
        http_requests_total.labels(
            service=self.service_name,
            method=method,
            endpoint=endpoint,
            status=str(status),
        ).inc()

        http_request_duration_seconds.labels(
            service=self.service_name,
            method=method,
            endpoint=endpoint,
        ).observe(duration)

    def track_ai_job(
        self,
        job_type: str,
        status: str,
        duration: float,
    ) -> None:
        """Track an AI job."""
        ai_jobs_total.labels(
            service=self.service_name,
            job_type=job_type,
            status=status,
        ).inc()

        ai_job_duration_seconds.labels(
            service=self.service_name,
            job_type=job_type,
            status=status,
        ).observe(duration)

    def set_queue_size(self, queue_name: str, size: int) -> None:
        """Update queue size gauge."""
        ai_queue_size.labels(
            service=self.service_name,
            queue_name=queue_name,
        ).set(size)

    def track_order(self, product_type: str, status: str) -> None:
        """Track an order."""
        orders_total.labels(
            product_type=product_type,
            status=status,
        ).inc()

    def track_revenue(
        self,
        amount_cents: int,
        currency: str,
        payment_provider: str,
        product_type: str,
    ) -> None:
        """Track revenue."""
        revenue_total.labels(
            currency=currency,
            payment_provider=payment_provider,
            product_type=product_type,
        ).inc(amount_cents)

    def track_moderation(
        self,
        content_type: str,
        result: str,
        duration: float,
    ) -> None:
        """Track a moderation check."""
        moderation_checks_total.labels(
            content_type=content_type,
            result=result,
        ).inc()

        moderation_latency_seconds.labels(
            content_type=content_type,
        ).observe(duration)


# Global metrics instance
_metrics: Optional[MetricsCollector] = None


def get_metrics(service_name: Optional[str] = None) -> MetricsCollector:
    """Get the metrics collector."""
    global _metrics
    if _metrics is None:
        _metrics = MetricsCollector(service_name or "unknown")
    return _metrics


# Alias for backward compatibility
metrics = get_metrics


def track_request(method: str, endpoint: str):
    """Decorator to track request metrics."""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            status = 200
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status = getattr(e, "status_code", 500)
                raise
            finally:
                duration = time.time() - start_time
                get_metrics().track_request(method, endpoint, status, duration)

        return wrapper

    return decorator


def track_ai_job(job_type: str):
    """Decorator to track AI job metrics."""

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            status = "success"
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception:
                status = "error"
                raise
            finally:
                duration = time.time() - start_time
                get_metrics().track_ai_job(job_type, status, duration)

        return wrapper

    return decorator


class AnalyticsTracker:
    """Analytics event tracking for Amplitude/Mixpanel/Firebase."""

    def __init__(self, service_name: str):
        self.service_name = service_name
        self._amplitude_key: Optional[str] = None
        self._mixpanel_token: Optional[str] = None

    def configure(
        self,
        amplitude_key: Optional[str] = None,
        mixpanel_token: Optional[str] = None,
    ) -> None:
        """Configure analytics providers."""
        self._amplitude_key = amplitude_key
        self._mixpanel_token = mixpanel_token

    def track(
        self,
        event_name: str,
        user_id: Optional[str] = None,
        properties: Optional[dict[str, Any]] = None,
    ) -> None:
        """Track an analytics event."""
        # In production, this would send to Amplitude/Mixpanel
        # For now, we log the event
        import structlog
        logger = structlog.get_logger("analytics")
        logger.info(
            "analytics_event",
            event=event_name,
            user_id=user_id,
            properties=properties or {},
            service=self.service_name,
        )

    def identify(
        self,
        user_id: str,
        traits: Optional[dict[str, Any]] = None,
    ) -> None:
        """Identify a user with traits."""
        import structlog
        logger = structlog.get_logger("analytics")
        logger.info(
            "user_identified",
            user_id=user_id,
            traits=traits or {},
            service=self.service_name,
        )

    # Standard event taxonomy
    def track_signup(self, user_id: str, method: str) -> None:
        self.track("user_signup", user_id, {"method": method})

    def track_login(self, user_id: str, method: str) -> None:
        self.track("user_login", user_id, {"method": method})

    def track_video_created(
        self, user_id: str, artist_id: str, duration_seconds: float
    ) -> None:
        self.track(
            "video_created",
            user_id,
            {"artist_id": artist_id, "duration_seconds": duration_seconds},
        )

    def track_purchase(
        self, user_id: str, product_type: str, amount_cents: int, currency: str
    ) -> None:
        self.track(
            "purchase_completed",
            user_id,
            {
                "product_type": product_type,
                "amount_cents": amount_cents,
                "currency": currency,
            },
        )

    def track_share(self, user_id: str, content_type: str, platform: str) -> None:
        self.track(
            "content_shared",
            user_id,
            {"content_type": content_type, "platform": platform},
        )

    def track_face_quiz_completed(
        self, user_id: str, artist_id: str, similarity_score: float
    ) -> None:
        self.track(
            "face_quiz_completed",
            user_id,
            {"artist_id": artist_id, "similarity_score": similarity_score},
        )
