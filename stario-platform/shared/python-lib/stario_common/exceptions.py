"""
Custom exceptions for the Stario platform.
"""

from typing import Any, Optional


class StarioException(Exception):
    """Base exception for all Stario errors."""

    def __init__(
        self,
        message: str,
        error_code: str = "STARIO_ERROR",
        status_code: int = 500,
        details: Optional[dict[str, Any]] = None,
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> dict[str, Any]:
        return {
            "error": self.error_code,
            "message": self.message,
            "details": self.details,
        }


class NotFoundError(StarioException):
    """Resource not found."""

    def __init__(
        self,
        resource: str,
        identifier: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} with ID '{identifier}' not found"
        super().__init__(
            message=message,
            error_code="NOT_FOUND",
            status_code=404,
            details=details,
        )


class ValidationError(StarioException):
    """Input validation failed."""

    def __init__(
        self,
        message: str = "Validation failed",
        errors: Optional[list[dict[str, Any]]] = None,
    ):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=422,
            details={"errors": errors or []},
        )


class AuthenticationError(StarioException):
    """Authentication failed."""

    def __init__(
        self,
        message: str = "Authentication required",
        details: Optional[dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_ERROR",
            status_code=401,
            details=details,
        )


class AuthorizationError(StarioException):
    """Authorization failed."""

    def __init__(
        self,
        message: str = "Permission denied",
        required_permission: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        details = details or {}
        if required_permission:
            details["required_permission"] = required_permission
        super().__init__(
            message=message,
            error_code="AUTHORIZATION_ERROR",
            status_code=403,
            details=details,
        )


class RateLimitError(StarioException):
    """Rate limit exceeded."""

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: Optional[int] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        details = details or {}
        if retry_after:
            details["retry_after_seconds"] = retry_after
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            details=details,
        )


class ServiceUnavailableError(StarioException):
    """External service unavailable."""

    def __init__(
        self,
        service: str,
        message: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        details = details or {}
        details["service"] = service
        super().__init__(
            message=message or f"Service '{service}' is temporarily unavailable",
            error_code="SERVICE_UNAVAILABLE",
            status_code=503,
            details=details,
        )


class PaymentError(StarioException):
    """Payment processing failed."""

    def __init__(
        self,
        message: str = "Payment failed",
        provider: Optional[str] = None,
        transaction_id: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        details = details or {}
        if provider:
            details["provider"] = provider
        if transaction_id:
            details["transaction_id"] = transaction_id
        super().__init__(
            message=message,
            error_code="PAYMENT_ERROR",
            status_code=402,
            details=details,
        )


class ModerationError(StarioException):
    """Content moderation rejection."""

    def __init__(
        self,
        reason: str,
        content_type: str = "content",
        violations: Optional[list[str]] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        details = details or {}
        details["content_type"] = content_type
        if violations:
            details["violations"] = violations
        super().__init__(
            message=f"Content rejected: {reason}",
            error_code="MODERATION_REJECTED",
            status_code=400,
            details=details,
        )


class AIServiceError(StarioException):
    """AI service error."""

    def __init__(
        self,
        service: str,
        message: str = "AI processing failed",
        details: Optional[dict[str, Any]] = None,
    ):
        details = details or {}
        details["ai_service"] = service
        super().__init__(
            message=message,
            error_code="AI_SERVICE_ERROR",
            status_code=500,
            details=details,
        )


class QueueError(StarioException):
    """Job queue error."""

    def __init__(
        self,
        message: str = "Queue operation failed",
        job_id: Optional[str] = None,
        queue_name: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        details = details or {}
        if job_id:
            details["job_id"] = job_id
        if queue_name:
            details["queue_name"] = queue_name
        super().__init__(
            message=message,
            error_code="QUEUE_ERROR",
            status_code=500,
            details=details,
        )


class StorageError(StarioException):
    """Storage operation failed."""

    def __init__(
        self,
        message: str = "Storage operation failed",
        bucket: Optional[str] = None,
        key: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        details = details or {}
        if bucket:
            details["bucket"] = bucket
        if key:
            details["key"] = key
        super().__init__(
            message=message,
            error_code="STORAGE_ERROR",
            status_code=500,
            details=details,
        )


class ConfigurationError(StarioException):
    """Configuration error."""

    def __init__(
        self,
        message: str = "Configuration error",
        config_key: Optional[str] = None,
        details: Optional[dict[str, Any]] = None,
    ):
        details = details or {}
        if config_key:
            details["config_key"] = config_key
        super().__init__(
            message=message,
            error_code="CONFIGURATION_ERROR",
            status_code=500,
            details=details,
        )
