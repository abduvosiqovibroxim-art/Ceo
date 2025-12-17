"""
Structured logging configuration.
"""

import logging
import sys
from datetime import datetime
from typing import Any, Optional

import structlog
from structlog.types import EventDict, Processor

from .config import get_settings


def add_timestamp(
    logger: logging.Logger, method_name: str, event_dict: EventDict
) -> EventDict:
    """Add ISO timestamp to log events."""
    event_dict["timestamp"] = datetime.utcnow().isoformat() + "Z"
    return event_dict


def add_service_info(
    logger: logging.Logger, method_name: str, event_dict: EventDict
) -> EventDict:
    """Add service information to log events."""
    settings = get_settings()
    event_dict["environment"] = settings.environment
    return event_dict


def setup_logging(service_name: str, log_level: Optional[str] = None) -> None:
    """Configure structured logging for a service."""
    settings = get_settings()
    level = log_level or settings.log_level

    # Shared processors
    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        add_timestamp,
        add_service_info,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    if settings.environment == "development":
        # Pretty console output for development
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True)
        ]
    else:
        # JSON output for production
        processors = shared_processors + [
            structlog.processors.JSONRenderer()
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Configure standard logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, level.upper()),
    )

    # Silence noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("boto3").setLevel(logging.WARNING)
    logging.getLogger("botocore").setLevel(logging.WARNING)


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """Get a structured logger."""
    return structlog.get_logger(name)


class RequestLogger:
    """Context manager for request logging."""

    def __init__(
        self,
        logger: structlog.stdlib.BoundLogger,
        request_id: str,
        method: str,
        path: str,
        user_id: Optional[str] = None,
    ):
        self.logger = logger.bind(
            request_id=request_id,
            method=method,
            path=path,
            user_id=user_id,
        )
        self.start_time = None

    def __enter__(self) -> "RequestLogger":
        self.start_time = datetime.utcnow()
        self.logger.info("request_started")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        duration_ms = (datetime.utcnow() - self.start_time).total_seconds() * 1000
        if exc_type:
            self.logger.error(
                "request_failed",
                duration_ms=duration_ms,
                error_type=exc_type.__name__,
                error=str(exc_val),
            )
        else:
            self.logger.info("request_completed", duration_ms=duration_ms)

    def log(self, event: str, **kwargs: Any) -> None:
        """Log an event within the request context."""
        self.logger.info(event, **kwargs)

    def error(self, event: str, **kwargs: Any) -> None:
        """Log an error within the request context."""
        self.logger.error(event, **kwargs)


class AuditLogger:
    """Audit logging for compliance."""

    def __init__(self, service_name: str):
        self.logger = get_logger(f"audit.{service_name}")

    def log_action(
        self,
        action: str,
        actor_id: str,
        resource_type: str,
        resource_id: str,
        details: Optional[dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> None:
        """Log an auditable action."""
        self.logger.info(
            "audit_event",
            action=action,
            actor_id=actor_id,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            ip_address=ip_address,
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    def log_data_access(
        self,
        actor_id: str,
        resource_type: str,
        resource_ids: list[str],
        purpose: str,
        ip_address: Optional[str] = None,
    ) -> None:
        """Log data access for compliance."""
        self.logger.info(
            "data_access",
            actor_id=actor_id,
            resource_type=resource_type,
            resource_ids=resource_ids,
            purpose=purpose,
            ip_address=ip_address,
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    def log_data_export(
        self,
        actor_id: str,
        export_type: str,
        record_count: int,
        purpose: str,
        ip_address: Optional[str] = None,
    ) -> None:
        """Log data export for legal compliance."""
        self.logger.info(
            "data_export",
            actor_id=actor_id,
            export_type=export_type,
            record_count=record_count,
            purpose=purpose,
            ip_address=ip_address,
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
